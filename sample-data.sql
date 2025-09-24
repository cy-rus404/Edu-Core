-- Insert sample students
INSERT INTO students (name, age, dob, mother_name, mother_contact, father_name, father_contact, class, email, gender, student_id) VALUES
('John Doe', 8, '2015-05-15', 'Jane Doe', '0123456789', 'James Doe', '0987654321', 'Class 2', 'john.doe@student.edu', 'male', '1001'),
('Mary Smith', 6, '2017-08-20', 'Sarah Smith', '0111222333', 'Mike Smith', '0444555666', 'Class 1', 'mary.smith@student.edu', 'female', '1002'),
('David Johnson', 10, '2013-12-10', 'Lisa Johnson', '0777888999', 'Robert Johnson', '0123987456', 'Class 4', 'david.johnson@student.edu', 'male', '1003');

-- Insert sample teachers
INSERT INTO teachers (name, age, subject, email, gender, assigned_class, teacher_id) VALUES
('Mrs. Anderson', 35, 'Mathematics', 'anderson@school.edu', 'female', 'Class 2', '2001'),
('Mr. Wilson', 42, 'English', 'wilson@school.edu', 'male', 'Class 1', '2002'),
('Ms. Brown', 28, 'Science', 'brown@school.edu', 'female', 'Class 4', '2003');

-- Insert sample announcements
INSERT INTO announcements (title, content, target_audience, created_by) VALUES
('Welcome Back to School', 'We are excited to welcome all students back for the new academic year!', 'students', 'admin'),
('Parent-Teacher Meeting', 'Parent-teacher meetings will be held next Friday from 2 PM to 5 PM.', 'students', 'admin'),
('Staff Meeting', 'Monthly staff meeting scheduled for tomorrow at 3 PM in the conference room.', 'teachers', 'admin');