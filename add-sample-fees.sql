-- Add sample student fees for testing
INSERT INTO public.student_fees (student_id, student_name, class, description, amount_due, amount_paid, due_date, status) VALUES
('STU001', 'John Doe', 'Class 1', 'Tuition Fee', 500.00, 0.00, '2024-03-15', 'Pending'),
('STU001', 'John Doe', 'Class 1', 'Library Fee', 50.00, 0.00, '2024-03-15', 'Pending'),
('STU002', 'Jane Smith', 'KG1', 'Tuition Fee', 400.00, 0.00, '2024-03-15', 'Pending'),
('STU002', 'Jane Smith', 'KG1', 'Sports Fee', 75.00, 0.00, '2024-03-15', 'Pending');