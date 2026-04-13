import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface RatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

export function RatingDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  isLoading = false,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, comment);
    setRating(0);
    setComment("");
  };

  const handleClose = () => {
    setRating(0);
    setComment("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            <AnimatePresence>
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform"
                >
                  <Star
                    className={`h-8 w-8 transition-all ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400 scale-110"
                        : "text-gray-300"
                    }`}
                  />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Rating Text */}
          {rating > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-sm font-semibold text-gray-700">
                {rating === 1 && "سيء جداً"}
                {rating === 2 && "سيء"}
                {rating === 3 && "عادي"}
                {rating === 4 && "جيد"}
                {rating === 5 && "ممتاز"}
              </p>
            </motion.div>
          )}

          {/* Comment */}
          <AnimatePresence>
            {rating > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Textarea
                  placeholder="أضف تعليقك (اختياري)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  className="resize-none text-right"
                  dir="rtl"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {comment.length}/500
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                إرسال التقييم
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
