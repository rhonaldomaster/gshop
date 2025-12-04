export interface StorageProvider {
  /**
   * Upload a file to storage
   * @param file - File buffer
   * @param filename - Desired filename (will be sanitized)
   * @param contentType - MIME type of the file
   * @returns URL to access the uploaded file
   */
  uploadFile(
    file: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string>;

  /**
   * Delete a file from storage
   * @param fileUrl - URL or key of the file to delete
   */
  deleteFile(fileUrl: string): Promise<void>;

  /**
   * Get the full URL for a file
   * @param filename - Filename or key
   * @returns Full URL to access the file
   */
  getFileUrl(filename: string): string;

  /**
   * Check if the provider is available/configured
   * @returns true if provider is properly configured
   */
  isAvailable(): boolean;
}
