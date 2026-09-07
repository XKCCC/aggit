"use client";

// 删除按钮：提交前弹确认框，防止误删
export default function DeleteButton({
  label,
  confirmText,
  className = "",
}: {
  label: string;
  confirmText: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
