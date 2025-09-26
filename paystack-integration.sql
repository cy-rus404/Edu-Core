-- Add payment reference column to student_fees table
ALTER TABLE student_fees 
ADD COLUMN payment_reference VARCHAR(255);

-- Add index for payment reference lookups
CREATE INDEX idx_student_fees_payment_reference ON student_fees(payment_reference);

-- Update RLS policy to allow payment reference updates
DROP POLICY IF EXISTS "Allow authenticated users to update student_fees" ON student_fees;
CREATE POLICY "Allow authenticated users to update student_fees" ON student_fees
    FOR UPDATE USING (true)
    WITH CHECK (true);