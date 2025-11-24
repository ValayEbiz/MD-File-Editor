import Cookies from "js-cookie";

let folderIdCache: string | null = null;
let folderPromise: Promise<string | null> | null = null;
let tokenClient: any = null;

export const getAccessToken = () => Cookies.get("google_drive_token");

export const initTokenClient = () => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: "https://www.googleapis.com/auth/drive.file",
    callback: (response: { access_token: string }) => {
      Cookies.set("google_drive_token", response.access_token);
      gapi.client.setToken({ access_token: response.access_token });
    },
  });
};

export const refreshAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject("Token client missing");

    tokenClient.callback = (response: {
      error: any;
      access_token: string | PromiseLike<string>;
    }) => {
      if (response.error) return reject(response.error);

      const token = String(response.access_token);
      Cookies.set("google_drive_token", token);
      gapi.client.setToken({ access_token: token });

      resolve(token);
    };

    tokenClient.requestAccessToken({ prompt: "" }); // silent
  });
};

export const requestDriveAccess = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (response: {
      error: any;
      access_token: string | PromiseLike<string>;
    }) => {
      if (response.error) return reject(response);

      const token = String(response.access_token);
      Cookies.set("google_drive_token", token, { expires: 7 });
      gapi.client.setToken({ access_token: token });

      resolve(token);
    };

    tokenClient.requestAccessToken({ prompt: "consent" });
  });
};

export const initGapi = () =>
  new Promise<void>((resolve) => {
    gapi.load("client", async () => {
      await gapi.client.init({
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
        ],
      });

      // Attach GIS token to gapi
      const token = Cookies.get("google_drive_token");
      if (token) {
        gapi.client.setToken({ access_token: token });
      }

      resolve();
    });
  });

// Create or get "MD File Editor" folder
export const getOrCreateFolder = async (): Promise<string | null> => {
  return withAutoRefresh(async () => {
    if (folderIdCache) return folderIdCache;
    if (folderPromise) return folderPromise;

    folderPromise = (async () => {
      const accessToken = getAccessToken();
      if (!accessToken) return null;

      const res: any = await gapi.client.drive.files.list({
        q: "name='MD File Editor' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: "files(id, name)",
      });

      if (res.result.files?.length > 0) {
        folderIdCache = res.result.files[0].id;
        return folderIdCache;
      }

      const folder = await gapi.client.drive.files.create({
        resource: {
          name: "MD File Editor",
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });

      folderIdCache = folder.result.id;
      return folderIdCache;
    })();

    const val = await folderPromise;
    folderPromise = null;
    return val;
  });
};

export const uploadOrUpdateFile = async (
  fileId: string | null,
  name: string,
  content: string
) =>
  withAutoRefresh(async () => {
    await gapi.client.load("drive", "v3");

    const boundary = "-------314159265358979323846";
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelim = "\r\n--" + boundary + "--";

    const metadata = fileId
      ? { name }
      : { name, parents: [await getOrCreateFolder()] };

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: text/plain\r\n\r\n" +
      content +
      closeDelim;

    const path = fileId
      ? `upload/drive/v3/files/${fileId}`
      : `upload/drive/v3/files`;

    const method = fileId ? "PATCH" : "POST";

    const response = await gapi.client.request({
      path,
      method,
      params: { uploadType: "multipart" },
      headers: {
        "Content-Type": "multipart/related; boundary=" + boundary,
      },
      body: multipartRequestBody,
    });

    return response.result;
  });

export const deleteDriveFile = (fileId: string) =>
  withAutoRefresh(() =>
    gapi.client.drive.files.delete({
      fileId,
    })
  );

// Rename
export const renameDriveFile = (fileId: string, newName: string) =>
  withAutoRefresh(() =>
    gapi.client.drive.files.update({
      fileId,
      resource: { name: newName },
    })
  );

export const fetchAllDriveFiles = async () =>
  withAutoRefresh(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) return [];

    const folderId = await getOrCreateFolder();
    if (!folderId) return [];

    const res: any = await gapi.client.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name)",
    });

    const final: any[] = [];
    for (const file of res.result.files) {
      const content = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ).then((r) => r.text());

      final.push({
        driveId: file.id,
        name: file.name,
        content,
        type: file.name.endsWith(".md") ? "md" : "txt",
      });
    }

    return final;
  });

export async function withAutoRefresh(fn: Function) {
  try {
    return await fn();
  } catch (err: any) {
    if (err.status === 401) {
      await refreshAccessToken();
      return await fn();
    }
    throw err;
  }
}
