-- Sample Student Data for Testing
-- Run this in your Supabase SQL Editor to populate the student_data table

INSERT INTO student_data (hall_ticket, name, year, phone, role) VALUES
('21A91A0501', 'Rahul Sharma', '3rd Year', '9876543210', 'student'),
('21A91A0502', 'Priya Patel', '3rd Year', '9876543211', 'student'),
('21A91A0503', 'Amit Kumar', '3rd Year', '9876543212', 'student'),
('21A91A0504', 'Sneha Reddy', '2nd Year', '9876543213', 'student'),
('21A91A0505', 'Vikram Singh', '3rd Year', '9876543214', 'student'),
('21A91A0506', 'Anjali Gupta', '2nd Year', '9876543215', 'student'),
('21A91A0507', 'Rohan Verma', '3rd Year', '9876543216', 'student'),
('21A91A0508', 'Kavya Nair', '3rd Year', '9876543217', 'student'),
('21A91A0509', 'Arjun Rao', '2nd Year', '9876543218', 'student'),
('21A91A0510', 'Divya Menon', '3rd Year', '9876543219', 'student'),
('21A91A0511', 'Karthik Iyer', '3rd Year', '9876543220', 'student'),
('21A91A0512', 'Meera Joshi', '2nd Year', '9876543221', 'student'),
('21A91A0513', 'Siddharth Das', '3rd Year', '9876543222', 'student'),
('21A91A0514', 'Pooja Agarwal', '3rd Year', '9876543223', 'student'),
('21A91A0515', 'Nikhil Desai', '2nd Year', '9876543224', 'student'),
('21A91A0516', 'Riya Kapoor', '3rd Year', '9876543225', 'student'),
('21A91A0517', 'Aditya Malhotra', '3rd Year', '9876543226', 'student'),
('21A91A0518', 'Ishita Bansal', '2nd Year', '9876543227', 'student'),
('21A91A0519', 'Varun Khanna', '3rd Year', '9876543228', 'student'),
('21A91A0520', 'Sakshi Chopra', '3rd Year', '9876543229', 'student'),
('21A91A0521', 'Harsh Pandey', '2nd Year', '9876543230', 'student'),
('21A91A0522', 'Tanvi Shah', '3rd Year', '9876543231', 'student'),
('21A91A0523', 'Kunal Mehta', '3rd Year', '9876543232', 'student'),
('21A91A0524', 'Nisha Sinha', '2nd Year', '9876543233', 'student'),
('21A91A0525', 'Gaurav Tiwari', '3rd Year', '9876543234', 'student')
ON CONFLICT (hall_ticket) DO NOTHING;

-- Verify the insert
SELECT COUNT(*) as total_students FROM student_data;
