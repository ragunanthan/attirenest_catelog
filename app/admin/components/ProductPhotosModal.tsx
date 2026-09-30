'use client';

import { useState, useTransition } from 'react';
import {
  X,
  Trash2,
  Star,
  ExternalLink,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import {
  deleteProductImageAction,
  setProductCoverImageAction,
  uploadProductImagesAction,
} from '../actions';

interface ProductPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    images: string[];
  } | null;
  onImagesUpdated: (productId: number, newImages: string[]) => void;
}

export function ProductPhotosModal({
  isOpen,
  onClose,
  product,
  onImagesUpdated,
}: ProductPhotosModalProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [confirmDeleteUrl, setConfirmDeleteUrl] = useState<string | null>(null);
  const [settingCoverUrl, setSettingCoverUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen || !product) return null;

  const currentImages = product.images || [];

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const handleDeleteImage = async (url: string) => {
    if (currentImages.length <= 1) {
      showStatus('error', 'A product must have at least one photo. Upload a replacement before deleting this one.');
      setConfirmDeleteUrl(null);
      return;
    }

    setDeletingUrl(url);
    setConfirmDeleteUrl(null);

    startTransition(async () => {
      try {
        const res = await deleteProductImageAction(product.id, url);
        if (res.error) {
          showStatus('error', res.error);
        } else {
          showStatus('success', 'Photo removed and storage cleaned up successfully.');
          const nextImages = res.remainingImages || currentImages.filter((img) => img !== url);
          onImagesUpdated(product.id, nextImages);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete photo';
        showStatus('error', msg);
      } finally {
        setDeletingUrl(null);
      }
    });
  };

  const handleSetCover = async (url: string) => {
    if (url === currentImages[0]) return; // Already cover

    setSettingCoverUrl(url);
    startTransition(async () => {
      try {
        const res = await setProductCoverImageAction(product.id, url);
        if (res.error) {
          showStatus('error', res.error);
        } else {
          showStatus('success', 'Cover photo updated!');
          const nextImages = res.updatedImages || [url, ...currentImages.filter((img) => img !== url)];
          onImagesUpdated(product.id, nextImages);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to set cover photo';
        showStatus('error', msg);
      } finally {
        setSettingCoverUrl(null);
      }
    });
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const f of files) {
      if (f.size > 4.5 * 1024 * 1024) {
        showStatus('error', `"${f.name}" exceeds 4.5MB limit.`);
        continue;
      }
      validFiles.push(f);
      previews.push(URL.createObjectURL(f));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setUploadPreviews((prev) => [...prev, ...previews]);
    e.target.value = '';
  };

  const removePendingUpload = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('images', file));

    try {
      const res = await uploadProductImagesAction(product.id, formData);
      if (res.error) {
        showStatus('error', res.error);
      } else {
        showStatus('success', `${selectedFiles.length} photo(s) added successfully!`);
        // Clean previews
        uploadPreviews.forEach((url) => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setUploadPreviews([]);
        if (res.updatedImages) {
          onImagesUpdated(product.id, res.updatedImages);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showStatus('error', msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-3xl rounded-3xl border border-[#E8E2D9] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h3
                className="text-lg font-bold text-[#2E2A27] truncate"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Product Photos: {product.name}
              </h3>
              <span className="shrink-0 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#E8E2D9] text-[#5C564E]">
                #{product.id}
              </span>
            </div>
            <p className="text-xs text-[#7A7367] mt-0.5">
              {currentImages.length} photo{currentImages.length !== 1 ? 's' : ''} attached • First photo is displayed as the catalog cover.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7A7367] hover:text-[#2E2A27] hover:bg-[#E8E2D9]/50 transition cursor-pointer"
            title="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle size={16} className="shrink-0 text-red-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Current Photos Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A7367]">
                Current Gallery ({currentImages.length})
              </span>
              {currentImages.length <= 1 && (
                <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Minimum 1 photo required
                </span>
              )}
            </div>

            {currentImages.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-[#E8E2D9] rounded-2xl flex flex-col items-center justify-center text-[#8C8479] gap-2">
                <ImageIcon size={36} className="text-[#A39B8F]" />
                <p className="text-sm font-semibold">No photos attached to this product</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {currentImages.map((url, idx) => {
                  const isCover = idx === 0;
                  const isDeleting = deletingUrl === url;
                  const isSettingCover = settingCoverUrl === url;
                  const isConfirming = confirmDeleteUrl === url;

                  return (
                    <div
                      key={`img-${idx}-${url}`}
                      className={`relative aspect-square rounded-2xl overflow-hidden border group bg-[#F5F2EB] shadow-xs transition-all ${
                        isCover
                          ? 'border-[#5A7A56] ring-2 ring-[#5A7A56]/30'
                          : 'border-[#DCD6CC] hover:border-[#5A7A56]/50'
                      }`}
                    >
                      {/* Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`${product.name} photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Cover Badge */}
                      {isCover && (
                        <span className="absolute top-2 left-2 bg-[#5A7A56] text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 z-10">
                          <Star size={10} className="fill-current" /> COVER
                        </span>
                      )}

                      {/* Photo Index Badge */}
                      {!isCover && (
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shadow-xs z-10">
                          #{idx + 1}
                        </span>
                      )}

                      {/* Loading Overlay */}
                      {(isDeleting || isSettingCover) && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-xs gap-1.5 z-20">
                          <Loader2 size={20} className="animate-spin text-white" />
                          <span className="font-semibold">
                            {isDeleting ? 'Deleting...' : 'Updating...'}
                          </span>
                        </div>
                      )}

                      {/* Confirm Delete Overlay */}
                      {isConfirming && !isDeleting && (
                        <div className="absolute inset-0 bg-red-950/85 backdrop-blur-2xs flex flex-col items-center justify-center p-2 text-center text-white z-20 space-y-2">
                          <p className="text-[11px] font-bold leading-tight">Delete this photo?</p>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(url)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition shadow-xs cursor-pointer"
                            >
                              Yes, Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUrl(null)}
                              className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-[10px] font-medium rounded-lg transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Bar at Bottom of Image Card */}
                      {!isConfirming && !isDeleting && (
                        <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-1 transition-opacity">
                          {/* Left: Make Cover button if not already cover */}
                          {!isCover ? (
                            <button
                              type="button"
                              onClick={() => handleSetCover(url)}
                              disabled={isPending}
                              className="px-2 py-1 bg-white/90 hover:bg-white text-[#2E2A27] text-[10px] font-bold rounded-lg shadow-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                              title="Make this the primary cover photo"
                            >
                              <Star size={11} className="text-[#5A7A56]" />
                              <span>Set Cover</span>
                            </button>
                          ) : (
                            <div />
                          )}

                          {/* Right: View & Delete buttons */}
                          <div className="flex items-center gap-1">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md bg-white/80 hover:bg-white text-[#2E2A27] transition shadow-xs"
                              title="View full size photo"
                            >
                              <ExternalLink size={12} />
                            </a>

                            <button
                              type="button"
                              onClick={() => {
                                if (currentImages.length <= 1) {
                                  showStatus('error', 'Cannot delete: A product must have at least 1 photo.');
                                  return;
                                }
                                setConfirmDeleteUrl(url);
                              }}
                              disabled={isPending || currentImages.length <= 1}
                              className={`p-1 rounded-md transition shadow-xs cursor-pointer ${
                                currentImages.length <= 1
                                  ? 'bg-gray-400/60 text-white opacity-50 cursor-not-allowed'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                              title={
                                currentImages.length <= 1
                                  ? 'Cannot delete the only photo'
                                  : 'Delete this photo'
                              }
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Upload Dropzone */}
          <div className="pt-2 border-t border-[#E8E2D9] space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A7367]">
              Add More Photos
            </span>

            <div className="space-y-3">
              <label className="border-2 border-dashed border-[#5A7A56]/40 hover:border-[#5A7A56] bg-[#5A7A56]/5 hover:bg-[#5A7A56]/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition">
                <div className="w-8 h-8 rounded-full bg-[#5A7A56]/15 text-[#5A7A56] flex items-center justify-center">
                  <UploadCloud size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#5A7A56]">Click to browse</span>
                  <span className="text-xs text-[#7A7367]"> or drag photos here</span>
                </div>
                <span className="text-[10px] text-[#8C8479]">JPG, PNG, WebP up to 4.5MB</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelection}
                  className="hidden"
                />
              </label>

              {/* Pending Upload Previews */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#5C564E]">
                    <span>{selectedFiles.length} new photo(s) selected:</span>
                    <button
                      type="button"
                      onClick={() => {
                        uploadPreviews.forEach((u) => URL.revokeObjectURL(u));
                        setSelectedFiles([]);
                        setUploadPreviews([]);
                      }}
                      className="text-red-600 hover:underline text-[11px]"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {uploadPreviews.map((preview, i) => (
                      <div
                        key={`preview-${i}`}
                        className="relative aspect-square rounded-xl overflow-hidden border border-[#5A7A56]/40 bg-[#FAF7F2]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePendingUpload(i)}
                          className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-full shadow-xs transition"
                          title="Remove selection"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleUploadSubmit}
                    disabled={isUploading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#5A7A56] hover:bg-[#486345] text-white text-xs font-bold shadow-md shadow-[#5A7A56]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Uploading Photos to Storage...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={15} />
                        <span>Save & Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E8E2D9] bg-[#FAF7F2] flex items-center justify-between text-xs text-[#7A7367]">
          <span>
            💡 Deleting an image permanently removes it from Cloudflare R2 storage and the catalogue.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#DCD6CC] hover:bg-[#E8E2D9]/30 text-[#2E2A27] font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
