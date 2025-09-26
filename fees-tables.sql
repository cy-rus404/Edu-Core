-- Create student_fees table for fee management

CREATE TABLE IF NOT EXISTS public.student_fees (
    id BIGSERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    class TEXT NOT NULL,
    description TEXT NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    due_date DATE,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Paid', 'Partial', 'Pending', 'Overdue')),
    payment_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON public.student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_class ON public.student_fees(class);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON public.student_fees(status);
CREATE INDEX IF NOT EXISTS idx_student_fees_due_date ON public.student_fees(due_date);

-- Enable RLS
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for student_fees
DROP POLICY IF EXISTS "Enable read access for all users" ON public.student_fees;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.student_fees;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.student_fees;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.student_fees;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.student_fees FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.student_fees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.student_fees FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.student_fees FOR DELETE USING (auth.role() = 'authenticated');

-- Create fee_templates table for admin to set fees per class
CREATE TABLE IF NOT EXISTS public.fee_templates (
    id BIGSERIAL PRIMARY KEY,
    class TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    due_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fee_templates
CREATE INDEX IF NOT EXISTS idx_fee_templates_class ON public.fee_templates(class);
CREATE INDEX IF NOT EXISTS idx_fee_templates_active ON public.fee_templates(is_active);

-- Enable RLS for fee_templates
ALTER TABLE public.fee_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for fee_templates
DROP POLICY IF EXISTS "Enable read access for all users" ON public.fee_templates;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.fee_templates;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.fee_templates;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.fee_templates;

-- Create policies for fee_templates
CREATE POLICY "Enable read access for all users" ON public.fee_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.fee_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.fee_templates FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.fee_templates FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample fee templates
INSERT INTO public.fee_templates (class, description, amount, due_date) VALUES
('Creche', 'Tuition Fee', 300.00, '2024-03-15'),
('Nursery', 'Tuition Fee', 350.00, '2024-03-15'),
('KG1', 'Tuition Fee', 400.00, '2024-03-15'),
('KG2', 'Tuition Fee', 400.00, '2024-03-15'),
('Class 1', 'Tuition Fee', 500.00, '2024-03-15'),
('Class 2', 'Tuition Fee', 500.00, '2024-03-15'),
('Class 3', 'Tuition Fee', 550.00, '2024-03-15'),
('Class 4', 'Tuition Fee', 550.00, '2024-03-15'),
('Class 5', 'Tuition Fee', 600.00, '2024-03-15'),
('Class 6', 'Tuition Fee', 600.00, '2024-03-15'),
('JHS 1', 'Tuition Fee', 700.00, '2024-03-15'),
('JHS 2', 'Tuition Fee', 700.00, '2024-03-15'),
('JHS 3', 'Tuition Fee', 750.00, '2024-03-15')
ON CONFLICT DO NOTHING;

-- Sample data removed - fees will be auto-generated from templates