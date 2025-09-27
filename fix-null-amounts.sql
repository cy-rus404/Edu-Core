-- Fix NULL values in student_fees table
UPDATE public.student_fees 
SET amount_paid = 0 
WHERE amount_paid IS NULL;

UPDATE public.student_fees 
SET amount_due = 0 
WHERE amount_due IS NULL;

-- Ensure the column has proper default
ALTER TABLE public.student_fees 
ALTER COLUMN amount_paid SET DEFAULT 0;

ALTER TABLE public.student_fees 
ALTER COLUMN amount_due SET DEFAULT 0;