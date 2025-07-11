// Google Drive API integration for file management
export interface DriveFile {
  id: string
  name: string
  mimeType: string
  createdTime: string
  modifiedTime: string
  size?: string
  webViewLink?: string
  webContentLink?: string
}

export interface CreateFileOptions {
  name: string
  parents?: string[]
  mimeType?: string
}

export class GoogleDriveService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  // Create a new folder
  async createFolder(name: string, parentId?: string): Promise<DriveFile> {
    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId && { parents: [parentId] })
    }

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(metadata)
    })

    if (!response.ok) {
      throw new Error('Failed to create folder')
    }

    return response.json()
  }

  // List files in a folder
  async listFiles(folderId?: string, mimeType?: string): Promise<DriveFile[]> {
    let query = ''
    const queryParts: string[] = []

    if (folderId) {
      queryParts.push(`'${folderId}' in parents`)
    }

    if (mimeType) {
      queryParts.push(`mimeType='${mimeType}'`)
    }

    if (queryParts.length > 0) {
      query = `?q=${encodeURIComponent(queryParts.join(' and '))}`
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files${query}&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,webContentLink)`,
      {
        headers: this.headers
      }
    )

    if (!response.ok) {
      throw new Error('Failed to list files')
    }

    const data = await response.json()
    return data.files || []
  }

  // Get file metadata
  async getFile(fileId: string): Promise<DriveFile> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,createdTime,modifiedTime,size,webViewLink,webContentLink`,
      {
        headers: this.headers
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get file')
    }

    return response.json()
  }

  // Delete a file
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: this.headers
      }
    )

    if (!response.ok) {
      throw new Error('Failed to delete file')
    }
  }

  // Share a file with specific permissions
  async shareFile(fileId: string, email: string, role: 'reader' | 'writer' | 'owner' = 'reader'): Promise<void> {
    const permission = {
      type: 'user',
      role,
      emailAddress: email
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(permission)
      }
    )

    if (!response.ok) {
      throw new Error('Failed to share file')
    }
  }

  // Make file public
  async makeFilePublic(fileId: string): Promise<void> {
    const permission = {
      type: 'anyone',
      role: 'reader'
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(permission)
      }
    )

    if (!response.ok) {
      throw new Error('Failed to make file public')
    }
  }

  // Copy a file
  async copyFile(fileId: string, name: string, parentId?: string): Promise<DriveFile> {
    const metadata = {
      name,
      ...(parentId && { parents: [parentId] })
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/copy`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(metadata)
      }
    )

    if (!response.ok) {
      throw new Error('Failed to copy file')
    }

    return response.json()
  }
}