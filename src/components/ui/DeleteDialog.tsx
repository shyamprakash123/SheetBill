import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Trash2, X } from "lucide-react";

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string | null;
  loading?: boolean;
}

export default function DeleteDialog({
  open,
  onClose,
  onConfirm,
  itemName,
  loading,
}: DeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!loading)
          // Prevent closing if loading
          onClose();
      }}
      classes={{
        paper: "rounded-2xl p-4", // Tailwind classes for the dialog paper
      }}
      maxWidth="sm"
      fullWidth={true}
    >
      {/* Close button */}
      <div className="flex justify-between items-center">
        <DialogTitle className="flex items-center gap-2 p-0">
          <Trash2 className="text-red-500" size={20} />
          <span className="text-lg font-semibold">
            {loading ? "Deleting..." : "Delete Confirmation"}
          </span>
        </DialogTitle>
        <IconButton
          onClick={() => {
            if (!loading)
              // Prevent closing if loading
              onClose();
          }}
          disabled={loading}
          className="!p-1"
        >
          <X size={18} />
        </IconButton>
      </div>

      <DialogContent className="mt-2">
        {loading ? (
          <Typography className="text-gray-700">
            <div className="flex items-center justify-center h-full">
              <CircularProgress size={40} color="primary" />
              <p className="ml-2 text-gray-500">
                Deleting{" "}
                <span className="font-semibold">{itemName || "the item"}</span>
                ...
              </p>
            </div>
          </Typography>
        ) : (
          <Typography className="text-gray-700">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{itemName || "this item"}</span>?
            This action cannot be undone.
          </Typography>
        )}
      </DialogContent>

      <DialogActions className="flex gap-2">
        <Button
          onClick={onClose}
          className="!bg-gray-200 !text-gray-800 hover:!bg-gray-300 normal-case disabled:!bg-gray-300 disabled:!cursor-not-allowed"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          className="!bg-red-600 !text-white hover:!bg-red-700 normal-case disabled:!bg-red-300 disabled:!cursor-not-allowed"
          disabled={loading}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
