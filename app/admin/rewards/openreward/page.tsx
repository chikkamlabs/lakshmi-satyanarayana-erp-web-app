'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  RefreshCw,
  Clock,
  Check,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import {
  fetchRewardById,
  fetchRewards,
  updateReward,
  uploadRewardImage,
  RewardRecord,
  UpdateRewardInput,
} from '@/lib/adminrewardStore';

function OpenRewardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rewardIdParam = searchParams.get('id') || '';

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(Boolean(rewardIdParam));
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [reward, setReward] = useState<RewardRecord | null>(null);
  const [allRewards, setAllRewards] = useState<RewardRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>(rewardIdParam);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<UpdateRewardInput>({
    id: rewardIdParam,
    name: '',
    description: '',
    points: 100,
    reward_url: '',
    status: 'active',
  });

  // Local image file replacement state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reloadCurrentReward = useCallback(async (idToLoad: string) => {
    if (!idToLoad) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetchRewardById(idToLoad);
      if (res.error || !res.data) {
        setErrorMessage(res.error || 'Reward not found.');
        setReward(null);
      } else {
        const item = res.data;
        setReward(item);
        setSelectedId(item.id);
        setFormData({
          id: item.id,
          name: item.name || '',
          description: item.description || '',
          points: item.points || 100,
          reward_url: item.reward_url || '',
          status: item.status || 'active',
        });
        setImagePreviewUrl(item.reward_url || null);
        setSelectedFile(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error loading reward details.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial list of all rewards for quick switching
  useEffect(() => {
    let mounted = true;
    async function loadCatalog() {
      const res = await fetchRewards();
      if (mounted && !res.error) {
        setAllRewards(res.data);
      }
    }
    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch reward on mount or param change
  useEffect(() => {
    let mounted = true;
    if (!rewardIdParam) {
      return;
    }

    async function loadData() {
      try {
        const res = await fetchRewardById(rewardIdParam);
        if (!mounted) return;

        if (res.error) {
          setErrorMessage(res.error);
        } else if (res.data) {
          const item = res.data;
          setReward(item);
          setSelectedId(item.id);
          setFormData({
            id: item.id,
            name: item.name || '',
            description: item.description || '',
            points: item.points || 100,
            reward_url: item.reward_url || '',
            status: item.status || 'active',
          });
          setImagePreviewUrl(item.reward_url || null);
          setSelectedFile(null);
        }
      } catch (err: any) {
        if (!mounted) return;
        setErrorMessage('Failed to load reward details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [rewardIdParam]);

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

  const handleRewardSwitch = (newId: string) => {
    if (!newId) return;
    router.push(`/admin/rewards/openreward?id=${newId}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.id) {
      setErrorMessage('No reward selected to update.');
      return;
    }

    if (!formData.name.trim()) {
      setErrorMessage('Reward name is required.');
      return;
    }

    if (!formData.points || formData.points <= 0) {
      setErrorMessage('Points must be a positive number greater than 0.');
      return;
    }

    setIsSaving(true);

    try {
      let finalRewardUrl = formData.reward_url || '';

      // If a new local file was selected, upload it to rewards_media bucket
      if (selectedFile) {
        setUploadingImage(true);
        const uploadResult = await uploadRewardImage(selectedFile);
        setUploadingImage(false);

        if (uploadResult.error) {
          setErrorMessage(`Image upload failed: ${uploadResult.error}`);
          setIsSaving(false);
          return;
        }

        if (uploadResult.url) {
          finalRewardUrl = uploadResult.url;
        }
      }

      const updateResult = await updateReward({
        id: formData.id,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        points: Number(formData.points),
        reward_url: finalRewardUrl || null,
        status: formData.status,
      });

      if (updateResult.error) {
        setErrorMessage(updateResult.error);
        setIsSaving(false);
        return;
      }

      if (updateResult.data) {
        setReward(updateResult.data);
        setFormData({
          id: updateResult.data.id,
          name: updateResult.data.name,
          description: updateResult.data.description || '',
          points: updateResult.data.points,
          reward_url: updateResult.data.reward_url || '',
          status: updateResult.data.status,
        });
        setImagePreviewUrl(updateResult.data.reward_url || null);
        setSelectedFile(null);
      }

      setSuccessMessage('Reward changes saved successfully!');
    } catch (err: any) {
      console.error('Error updating reward:', err);
      setErrorMessage(err?.message || 'Failed to save updates.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="admin-open-reward-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Breadcrumb & Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <Link
                  id="admin-open-reward-back-btn"
                  href="/admin/rewards/dashboard"
                  className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
                  title="Back to Rewards Catalog"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                      Rewards Module
                    </span>
                    {reward && (
                      <span
                        className={`erp-badge text-[10px] ${
                          reward.status === 'active' ? 'erp-badge-success' : 'erp-badge-secondary'
                        }`}
                      >
                        <span className="erp-badge-dot"></span>
                        {reward.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  <h1 id="admin-open-reward-title" className="erp-page-title text-xl sm:text-2xl">
                    {reward ? reward.name : 'Edit Reward'}
                  </h1>
                </div>
              </div>

              {/* Quick Reward Selector */}
              {allRewards.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] whitespace-nowrap hidden sm:inline">
                    Select Reward:
                  </span>
                  <select
                    id="reward-quick-selector"
                    value={selectedId}
                    onChange={(e) => handleRewardSwitch(e.target.value)}
                    className="erp-select text-xs py-1.5 px-2.5 max-w-xs"
                  >
                    <option value="" disabled>-- Choose a Reward --</option>
                    {allRewards.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.points} pts)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Notification Alerts */}
            {errorMessage && (
              <div
                id="admin-open-reward-error-banner"
                className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] flex items-start gap-3 erp-shake"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Notice: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {successMessage && (
              <div
                id="admin-open-reward-success-banner"
                className="p-4 rounded-lg bg-[var(--success-light)] border border-[var(--success)] text-[var(--success)] flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm font-semibold">{successMessage}</div>
              </div>
            )}

            {loading ? (
              <div className="erp-card p-12 text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mx-auto" />
                <p className="text-sm text-[var(--text-secondary)]">Loading reward configuration...</p>
              </div>
            ) : !reward && !selectedId ? (
              <div className="erp-card p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                  No reward selected
                </h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-5">
                  Please select a reward from the catalog or navigation menu to view and edit its fields.
                </p>
                <Link
                  href="/admin/rewards/dashboard"
                  className="erp-btn erp-btn-primary erp-btn-sm"
                >
                  Return to Rewards Dashboard
                </Link>
              </div>
            ) : (
              /* Reward Edit Form */
              <div className="erp-card shadow-sm">
                <div className="erp-card-header border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-[var(--primary)]" />
                    <h2 className="erp-card-title">Reward Specifications</h2>
                  </div>
                  {reward?.updated_at && (
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Last updated: {new Date(reward.updated_at).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>

                <form onSubmit={handleSave} className="erp-card-body space-y-6">
                  
                  {/* 1. Name & Points Grid */}
                  <div className="erp-grid-2">
                    {/* Reward Name */}
                    <div className="erp-form-group">
                      <label htmlFor="edit-reward-name" className="erp-label flex items-center gap-1">
                        <span>Reward Name</span>
                        <span className="text-[var(--danger)]">*</span>
                      </label>
                      <div className="relative">
                        <Gift className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="edit-reward-name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          maxLength={150}
                          className="erp-input erp-input-icon-left"
                        />
                      </div>
                      <span className="erp-helper-text">Max 150 characters</span>
                    </div>

                    {/* Points (INTEGER NOT NULL CHECK > 0) */}
                    <div className="erp-form-group">
                      <label htmlFor="edit-reward-points" className="erp-label flex items-center gap-1">
                        <span>Points Required</span>
                        <span className="text-[var(--danger)]">*</span>
                      </label>
                      <div className="relative">
                        <Coins className="w-4 h-4 text-[var(--warning)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="edit-reward-points"
                          name="points"
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={formData.points}
                          onChange={handleInputChange}
                          className="erp-input erp-input-icon-left font-semibold text-[var(--text-primary)]"
                        />
                      </div>
                      <span className="erp-helper-text">Incentive points needed to redeem</span>
                    </div>
                  </div>

                  {/* 2. Description */}
                  <div className="erp-form-group">
                    <label htmlFor="edit-reward-description" className="erp-label flex items-center gap-1">
                      <span>Description / Terms</span>
                      <span className="text-xs text-[var(--text-muted)] font-normal">(Optional)</span>
                    </label>
                    <textarea
                      id="edit-reward-description"
                      name="description"
                      rows={3}
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      placeholder="Enter specifications, warranty details, or redemption conditions..."
                      className="erp-textarea"
                    />
                    <span className="erp-helper-text">Description shown to field associates</span>
                  </div>

                  {/* 3. Image Upload & Replacement (rewards_media storage bucket) */}
                  <div className="erp-form-group">
                    <label className="erp-label flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span>Reward Image</span>
                        <span className="text-xs text-[var(--text-muted)] font-normal">(Stored in rewards_media bucket)</span>
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

                    {/* Hidden file input */}
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
                      id="edit-reward-file-input"
                    />

                    {imagePreviewUrl ? (
                      <div className="p-4 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={imagePreviewUrl}
                            alt="Current reward"
                            className="w-20 h-20 rounded-lg object-cover border border-[var(--border)] shadow-xs shrink-0"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {selectedFile ? selectedFile.name : 'Configured Reward Image'}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-xs sm:max-w-md">
                              {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB (New upload)` : formData.reward_url || 'Stored image'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="erp-btn erp-btn-outline erp-btn-sm text-xs py-1"
                              >
                                Upload Replacement
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 1x1 cm Micro View in Table */}
                        <div className="flex items-center sm:flex-col sm:items-center gap-2 sm:gap-1 sm:pl-4 sm:border-l sm:border-[var(--border)]">
                          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Table View (1x1 cm)</span>
                          <div
                            style={{ width: '1cm', height: '1cm' }}
                            className="rounded-md border border-[var(--border)] overflow-hidden bg-[var(--surface)] shadow-2xs"
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
                    ) : (
                      <div
                        id="edit-reward-dropzone"
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
                          Supports PNG, JPG, WebP, GIF or SVG up to 5MB. Stored automatically in the <strong className="font-semibold text-[var(--text-secondary)]">rewards_media</strong> bucket.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 4. Status (reward_status: active | inactive) */}
                  <div className="erp-form-group">
                    <label htmlFor="edit-reward-status" className="erp-label flex items-center gap-1">
                      <span>Reward Status</span>
                      <span className="text-[var(--danger)]">*</span>
                    </label>
                    <select
                      id="edit-reward-status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="erp-select"
                    >
                      <option value="active">Active (Available for associate redemption)</option>
                      <option value="inactive">Inactive (Archived / Hidden from catalog)</option>
                    </select>
                    <span className="erp-helper-text">
                      Toggle active status to temporarily hide or enable this reward
                    </span>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-4 flex items-center justify-between border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => reloadCurrentReward(formData.id)}
                      disabled={isSaving}
                      className="erp-btn erp-btn-ghost erp-btn-sm inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset Changes</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <Link
                        href="/admin/rewards/dashboard"
                        className="erp-btn erp-btn-outline erp-btn-sm"
                      >
                        Cancel
                      </Link>

                      <button
                        id="admin-edit-reward-save-btn"
                        type="submit"
                        disabled={isSaving || uploadingImage}
                        className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                      >
                        {isSaving || uploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{uploadingImage ? 'Uploading Image...' : 'Saving...'}</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminOpenRewardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
          <div className="erp-card p-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Loading Reward...
            </span>
          </div>
        </div>
      }
    >
      <OpenRewardContent />
    </Suspense>
  );
}
