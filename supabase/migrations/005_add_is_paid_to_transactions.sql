-- Add is_paid column to track payment/receipt/transfer status
ALTER TABLE transactions
  ADD COLUMN is_paid BOOLEAN NOT NULL DEFAULT true;

-- Backfill existing rows: future dates → pending (false), past/today → paid (true)
UPDATE transactions
  SET is_paid = (date <= CURRENT_DATE);
