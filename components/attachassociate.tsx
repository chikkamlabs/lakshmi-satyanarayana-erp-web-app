'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  X,
  Coins,
  Phone,
  UserCheck,
  Award,
  Loader2,
} from 'lucide-react';
import { fetchAssociates, AssociateRecord } from '@/lib/adminassociateStore';

interface AttachAssociateProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (associate: AssociateRecord) => void;
  selectedAssociateId?: string | null;
}

export default function AttachAssociate({
  isOpen,
  onClose,
  onSelect,
  selectedAssociateId,
}: AttachAssociateProps) {
  const [associates, setAssociates] = useState<AssociateRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    async function loadAssociates() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAssociates();
        if (!active) return;
        if (res.error) {
          setError(res.error);
        } else {
          setAssociates(res.data);
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Failed to load associates.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAssociates();
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      active = false;
    };
  }, [isOpen]);

  const filteredAssociates = useMemo(() => {
    if (!searchQuery.trim()) return associates;
    const q = searchQuery.toLowerCase().trim();
    return associates.filter((a) => {
      const matchId = (a.associate_id || '').toLowerCase().includes(q);
      const matchName = (a.profile?.name || '').toLowerCase().includes(q);
      const matchMobile = (a.profile?.mobile || '').toLowerCase().includes(q);
      return matchId || matchName || matchMobile;
    });
  }, [associates, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      id="attach-associate-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs erp-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="attach-associate-modal-card"
        className="w-full max-w-lg bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden erp-slide-up flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-subtle)]/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Attach Associate to Bill
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Search by Name, Mobile, or Associate ID
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[var(--border)] shrink-0 bg-[var(--surface)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              ref={searchInputRef}
              id="attach-associate-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by associate name, mobile (e.g. 9876543210), or code (e.g. ASC-101)..."
              className="erp-input pl-9 pr-8 text-xs w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Associate List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-[var(--border)]/40">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
              <span className="text-xs">Loading associates...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-xs text-[var(--danger)] bg-[var(--danger-light)]/20 rounded-lg">
              {error}
            </div>
          ) : filteredAssociates.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)]">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">No associates found</p>
              {searchQuery && (
                <p className="text-[11px] mt-1 text-[var(--text-muted)]">
                  Try a different search term
                </p>
              )}
            </div>
          ) : (
            filteredAssociates.map((assoc) => {
              const isSelected = selectedAssociateId === assoc.id;
              const name = assoc.profile?.name || 'Unnamed Associate';
              const mobile = assoc.profile?.mobile || 'No mobile';
              const points = assoc.current_points ?? 0;

              return (
                <div
                  key={assoc.id}
                  id={`attach-assoc-item-${assoc.id}`}
                  onClick={() => {
                    onSelect(assoc);
                    onClose();
                  }}
                  className={`pt-2.5 first:pt-0 p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary-light)]/30 shadow-xs'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/60 hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                        isSelected
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]'
                      }`}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                          {name}
                        </span>
                        <span className="erp-badge erp-badge-secondary font-mono text-[10px] py-0 px-1.5">
                          {assoc.associate_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>{mobile}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end text-xs font-bold text-[var(--accent)] font-mono">
                        <Coins className="w-3.5 h-3.5 text-[var(--warning)]" />
                        <span>{points.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">Points</span>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface)] text-[var(--primary)] border border-[var(--border)] hover:bg-[var(--primary)] hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Attached' : 'Attach'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-subtle)]/40 flex items-center justify-between text-xs shrink-0">
          <span className="text-[var(--text-muted)]">
            Showing {filteredAssociates.length} associate{filteredAssociates.length !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="erp-btn erp-btn-secondary py-1 px-3 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
