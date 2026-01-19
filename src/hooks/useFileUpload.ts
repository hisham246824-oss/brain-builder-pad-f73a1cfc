import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UploadedFile {
  id: string;
  name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
}

export function useFileUpload() {
  const { user } = useAuth();

  const uploadFile = useCallback(async (materialId: string, file: File): Promise<UploadedFile | null> => {
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${materialId}/${crypto.randomUUID()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('material-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('material-files')
        .getPublicUrl(uploadData.path);

      // Determine file type
      const getFileType = (name: string): string => {
        const ext = name.split('.').pop()?.toLowerCase() || '';
        if (ext === 'pdf') return 'pdf';
        if (['doc', 'docx'].includes(ext)) return 'docx';
        if (['ppt', 'pptx'].includes(ext)) return 'pptx';
        if (['xls', 'xlsx'].includes(ext)) return 'xlsx';
        if (ext === 'txt') return 'txt';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
        return 'other';
      };

      // Save file metadata to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('material_files')
        .insert({
          material_id: materialId,
          user_id: user.id,
          name: file.name,
          file_url: urlData.publicUrl,
          file_type: getFileType(file.name),
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Try to clean up the uploaded file
        await supabase.storage.from('material-files').remove([uploadData.path]);
        return null;
      }

      return fileRecord as UploadedFile;
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  }, [user]);

  const deleteFile = useCallback(async (fileId: string, fileUrl: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Extract the file path from the URL
      const urlParts = fileUrl.split('/material-files/');
      const filePath = urlParts[1];

      // Delete from storage
      if (filePath) {
        await supabase.storage.from('material-files').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('material_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('File delete error:', error);
      return false;
    }
  }, [user]);

  return { uploadFile, deleteFile };
}
