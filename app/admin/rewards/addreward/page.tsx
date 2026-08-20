'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gift,
  ArrowLeft,
  Upload,
  Coins,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import {
  createReward,
  uploadRewardImage,
  CreateRewardInput,
} from '@/lib/adminrewardStore';

export default function AdminAddRewardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateRewardInput>({
    name: '',
    description: '',
    points: 100,
    reward_url: '',
    status: 'active',
  });

  // Selected local image for preview before / during upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'points' ? Math.max(1, parseInt(value, 10) || 0) : value,
    }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Invalid file type. Please select a JPEG, PNG, WebP, GIF, or SVG image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    setErrorMessage(null);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setFormData((prev) => ({ ...prev, reward_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.name.trim()) {
      setErrorMessage('Please enter the Reward Name.');
      return;
    }

    if (!formData.points || formData.points <= 0) {
      setErrorMessage('Points must be a positive integer greater than 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalRewardUrl = formData.reward_url || '';

      // Upload image to Supabase Storage (bucket: rewards_media) if a new file is chosen
      if (selectedFile) {
        setUploadingImage(true);
        const uploadResult = await uploadRewardImage(selectedFile);
        setUploadingImage(false);

        if (uploadResult.error) {
          setErrorMessage(`Image upload failed: ${uploadResult.error}`);
          setIsSubmitting(false);
          return;
        }

        if (uploadResult.url) {
          finalRewardUrl = uploadResult.url;
        }
      }

      // Create reward in Supabase
      const createResult = await createReward({
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        points: Number(formData.points),
        reward_url: finalRewardUrl || null,
        status: formData.status,
      });

      if (createResult.error) {
        setErrorMessage(createResult.error);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Reward created successfully! Redirecting to catalog...');
      setTimeout(() => {
        router.push('/admin/rewards/dashboard');
      }, 1200);
    } catch (err: any) {
      console.error('Error creating reward:', err);
      setErrorMessage(err?.message || 'An unexpected error occurred while saving the reward.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="admin-add-reward-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Breadcrumb & Navigation */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <Link
                  id="admin-add-reward-back-btn"
                  href="/admin/rewards/dashboard"
                  className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
                  title="Back to Rewards Dashboard"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                      Rewards Module
                    </span>
                  </div>
                  <h1 id="admin-add-reward-title" className="erp-page-title text-xl sm:text-2xl">
                    Add New Reward
                  </h1>
                </div>
              </div>
            </div>

            {/* Notification Alerts */}
            {errorMessage && (
              <div
                id="admin-add-reward-error-banner"
                className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] flex items-start gap-3 erp-shake"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Error: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {successMessage && (
              <div
                id="admin-add-reward-success-banner"
                className="p-4 rounded-lg bg-[var(--success-light)] border border-[var(--success)] text-[var(--success)] flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm font-semibold">{successMessage}</div>
              </div>
            )}

            {/* Main Form Card */}
            <div className="erp-card shadow-sm">
              <div className="erp-card-header border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[var(--primary)]" />
                  <h2 className="erp-card-title">Reward Specifications</h2>
                </div>
                <span className="erp-small text-[var(--text-muted)]">
                  All fields correspond to public.rewards database schema
                </span>
              </div>

              <form onSubmit={handleSubmit} className="erp-card-body space-y-6">
                
                {/* 1. Name & Points Grid */}
                <div className="erp-grid-2">
                  {/* Reward Name */}
                  <div className="erp-form-group">
                    <label htmlFor="reward-name-input" className="erp-label flex items-center gap-1">
                      <span>Reward Name</span>
                      <span className="text-[var(--danger)]">*</span>
                    </label>
                    <div className="relative">
                      <Gift className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reward-name-input"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Smart Watch, Cash Coupon, Drill Kit"
                        maxLength={150}
                        className="erp-input erp-input-icon-left"
                      />
                    </div>
                    <span className="erp-helper-text">Max 150 characters</span>
                  </div>

                  {/* Points (INTEGER NOT NULL CHECK > 0) */}
                  <div className="erp-form-group">
                    <label htmlFor="reward-points-input" className="erp-label flex items-center gap-1">
                      <span>Points Required</span>
                      <span className="text-[var(--danger)]">*</span>
                    </label>
                    <div className="relative">
                      <Coins className="w-4 h-4 text-[var(--warning)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reward-points-input"
                        name="points"
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={formData.points}
                        onChange={handleInputChange}
                        placeholder="100"
                        className="erp-input erp-input-icon-left font-semibold text-[var(--text-primary)]"
                      />
                    </div>
                    <span className="erp-helper-text">Number of points an associate needs to redeem</span>
                  </div>
                </div>

                {/* 2. Description (TEXT NULL) */}
                <div className="erp-form-group">
                  <label htmlFor="reward-description-input" className="erp-label flex items-center gap-1">
                    <span>Description / Terms</span>
                    <span className="text-xs text-[var(--text-muted)] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="reward-description-input"
                      name="description"
                      rows={3}
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      placeholder="Enter specifications, warranty details, or redemption conditions..."
                      className="erp-textarea"
                    />
                  </div>
                  <span className="erp-helper-text">Brief description visible to associates</span>
                </div>

                {/* 3. Image Upload (reward_url stored in supabase bucket: rewards_media) */}
                <div className="erp-form-group">
                  <label className="erp-label flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span>Reward Image</span>
                      <span className="text-xs text-[var(--text-muted)] font-normal">(Uploaded to rewards_media bucket)</span>
                    </span>
                    {imagePreviewUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-xs text-[var(--danger)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Remove image</span>
                      </button>
                    )}
                  </label>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="reward-image-file-input"
                  />

                  {/* Drag and drop upload zone */}
                  {!imagePreviewUrl ? (
                    <div
                      id="reward-image-dropzone"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleFileDrop}
                      className={`
                        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                        ${
                          dragOver
                            ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                            : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface-subtle)]'
                        }
                      `}
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3 text-[var(--primary)] shadow-2xs">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                        Click to upload or drag and drop reward image
                      </p>
                      <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                        Supports PNG, JPG, WebP, GIF or SVG up to 5MB. Stored automatically in the <strong className="font-semibold text-[var(--text-secondary)]">rewards_media</strong> storage bucket.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center gap-4">
                      {/* 1x1 cm preview container demo + larger preview */}
                      <div className="relative">
                        <img
                          src={imagePreviewUrl}
                          alt="Reward preview"
                          className="w-20 h-20 rounded-lg object-cover border border-[var(--border)] shadow-xs"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {selectedFile ? selectedFile.name : 'Image selected'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Media ready'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="erp-btn erp-btn-outline erp-btn-sm text-xs py-1"
                          >
                            Change Image
                          </button>
                        </div>
                      </div>
                      {/* Micro thumbnail indicator showing the 1x1 cm view in table */}
                      <div className="hidden sm:flex flex-col items-center gap-1 pl-4 border-l border-[var(--border)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Table View (1x1 cm)</span>
                        <div
                          style={{ width: '1cm', height: '1cm' }}
                          className="rounded-md border border-[var(--border)] overflow-hidden bg-[var(--surface)]"
                        >
                          <img
                            src={imagePreviewUrl}
                            alt="1x1 cm preview"
                            style={{ width: '1cm', height: '1cm' }}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Status (reward_status: active | inactive) */}
                <div className="erp-form-group">
                  <label htmlFor="reward-status-select" className="erp-label flex items-center gap-1">
                    <span>Reward Status</span>
                    <span className="text-[var(--danger)]">*</span>
                  </label>
                  <select
                    id="reward-status-select"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="erp-select"
                  >
                    <option value="active">Active (Available for redemption)</option>
                    <option value="inactive">Inactive (Hidden from catalog)</option>
                  </select>
                  <span className="erp-helper-text">
                    Control whether this reward is immediately redeemable by associates
                  </span>
                </div>

                {/* Form Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--border)]">
                  <Link
                    href="/admin/rewards/dashboard"
                    className="erp-btn erp-btn-outline erp-btn-sm"
                  >
                    Cancel
                  </Link>

                  <button
                    id="admin-add-reward-submit-btn"
                    type="submit"
                    disabled={isSubmitting || uploadingImage}
                    className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                  >
                    {isSubmitting || uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{uploadingImage ? 'Uploading Image...' : 'Saving Reward...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save Reward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
