-- Drop existing tables completely
DROP TABLE IF EXISTS public.student_fees CASCADE;
DROP TABLE IF EXISTS public.fee_templates CASCADE;

-- Create student_fees table
CREATE TABLE public.student_fees (
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
    payment_reference VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fee_templates table
CREATE TABLE public.fee_templates (
    id BIGSERIAL PRIMARY KEY,
    class TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    due_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_student_fees_student_id ON public.student_fees(student_id);
CREATE INDEX idx_student_fees_class ON public.student_fees(class);
CREATE INDEX idx_student_fees_status ON public.student_fees(status);
CREATE INDEX idx_fee_templates_class ON public.fee_templates(class);

-- Enable RLS
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_templates ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Enable all operations" ON public.student_fees FOR ALL USING (true);
CREATE POLICY "Enable all operations" ON public.fee_templates FOR ALL USING (true);

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
('JHS 3', 'Tuition Fee', 750.00, '2024-03-15');