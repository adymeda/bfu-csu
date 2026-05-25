export interface Attachment {
     id: number
     uploader_id: number
     original_name: string
     mime_type: string
     size_bytes: number
     storage_name: string
     created_at: Date
}

export interface AttachmentPublic {
     id: number
     original_name: string
     mime_type: string
     size_bytes: number
}

export interface CreateAttachmentDto {
     uploader_id: number
     original_name: string
     mime_type: string
     size_bytes: number
}