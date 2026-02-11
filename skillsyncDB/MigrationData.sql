USE skillsync_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Data for table user
INSERT INTO `user` (`user_id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES ('5a633c22-87b4-49e6-9d04-15419b9d6217', 'John Applicant', 'applicant@example.com', '$2b$10$b11wf6nkpRqTiWYjAUOSYu7yFL53yhiW3TS6aJ5pts3GvtkQBIkTO', 'APPLICANT', 1770702228480, 1770702228480);
INSERT INTO `user` (`user_id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES ('72c17979-cdd8-4a9b-95f6-f16cf7f4a1cc', 'Sarah Recruiter', 'recruiter@example.com', '$2b$10$b11wf6nkpRqTiWYjAUOSYu7yFL53yhiW3TS6aJ5pts3GvtkQBIkTO', 'RECRUITER', 1770702228510, 1770702228510);
INSERT INTO `user` (`user_id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES ('61a93e42-9bd0-46bf-8279-78da52ef61d1', 'Mahitha Pankaja', 'mahithapankaja@gmail.com', '$2b$10$rUhu60Nfl2ocmw25FLJnX.f3yhKUKPQIPvckB57lqnWfsa2HmcApe', 'APPLICANT', 1770703676882, 1770703676882);
INSERT INTO `user` (`user_id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES ('94419139-5d6c-4088-a52d-e733338487df', 'Sandali Thilakarathne', 'sandalithilkrthn@gmail.com', '$2b$10$0EMTkpGrpA5I9NmRG4f/puyNEhzhvrPzjRSfR26IxPXZ8MkCsC.ge', 'RECRUITER', 1770704249795, 1770704249795);
INSERT INTO `user` (`user_id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES ('31aad8dd-4407-4cf6-a43b-009b32016a38', 'Lakmi Priyanjana', 'hmlpriyanjana@gmail.com', '$2b$10$fZTDw6AGlZLQC0LOC2oK2eRh7MvLjr8FCP/7KKALzFE5sbCN7Fd0u', 'APPLICANT', 1770804249654, 1770804249654);
INSERT INTO `user` (`user_id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES ('f20791ff-1d79-4072-8153-f8d7f128b1e4', 'Ruwangani Sandeepa', 'ruwanganisandeepa20@gmail.com', '$2b$10$rPVKdja0rspCf5hnk2/BPeRFeHoeFSjkP74CQ.yttzfUfKu1V2xsm', 'RECRUITER', 1770804311075, 1770804311075);

-- Data for table recruiter
INSERT INTO `recruiter` (`user_id`, `company_name`) VALUES ('72c17979-cdd8-4a9b-95f6-f16cf7f4a1cc', 'Tech Corp');
INSERT INTO `recruiter` (`user_id`, `company_name`) VALUES ('94419139-5d6c-4088-a52d-e733338487df', 'Unspecified');
INSERT INTO `recruiter` (`user_id`, `company_name`) VALUES ('f20791ff-1d79-4072-8153-f8d7f128b1e4', 'Unspecified');

-- Data for table applicant
INSERT INTO `applicant` (`user_id`, `resume_url`) VALUES ('5a633c22-87b4-49e6-9d04-15419b9d6217', NULL);
INSERT INTO `applicant` (`user_id`, `resume_url`) VALUES ('61a93e42-9bd0-46bf-8279-78da52ef61d1', NULL);
INSERT INTO `applicant` (`user_id`, `resume_url`) VALUES ('31aad8dd-4407-4cf6-a43b-009b32016a38', NULL);

-- Data for table job_description
INSERT INTO `job_description` (`job_id`, `recruiter_id`, `title`, `salary`, `description`, `location`, `posted_date`, `status`) VALUES ('e9d2872c-213a-443a-8cd7-850ebc467575', '94419139-5d6c-4088-a52d-e733338487df', 'Machine Learner', NULL, 'Need a machine learning pro for making an AI powered system.', 'Remote', 1770705774391, 'ACTIVE');
INSERT INTO `job_description` (`job_id`, `recruiter_id`, `title`, `salary`, `description`, `location`, `posted_date`, `status`) VALUES ('ce2f20dd-2995-4578-ab65-4d6a03a3b674', '94419139-5d6c-4088-a52d-e733338487df', 'Koththu Baas', NULL, 'Koththu gahanna supiri porak oni', 'Remote', 1770706354936, 'ACTIVE');

-- Data for table cv
INSERT INTO `cv` (`cv_id`, `applicant_id`, `job_id`, `format`, `file_name`, `file_url`, `submitted_date`) VALUES ('e49d78ac-c590-48ce-afca-cfdefa20e945', '61a93e42-9bd0-46bf-8279-78da52ef61d1', 'e9d2872c-213a-443a-8cd7-850ebc467575', 'application/pdf', 'PCV.pdf', '/uploads/cvs/cv-1770705872553-599381763.pdf', 1770705872578);
INSERT INTO `cv` (`cv_id`, `applicant_id`, `job_id`, `format`, `file_name`, `file_url`, `submitted_date`) VALUES ('cf356185-d8ae-42b5-89d7-07bea0e53885', '61a93e42-9bd0-46bf-8279-78da52ef61d1', 'ce2f20dd-2995-4578-ab65-4d6a03a3b674', 'application/pdf', 'PCV.pdf', '/uploads/cvs/cv-1770706451658-951178224.pdf', 1770706451684);

-- Data for table result
INSERT INTO `result` (`result_id`, `cv_id`, `processed_date`, `comment`, `status`, `score`) VALUES ('acc0aa3e-04b1-408d-88a7-b30a76345de4', 'e49d78ac-c590-48ce-afca-cfdefa20e945', 1770705937062, 'Sim: -0.02, Skills: 0.00, Gap: 0.0 yrs -> Shortlist Prob: 0.31', 'Not Shortlisted', 40);
INSERT INTO `result` (`result_id`, `cv_id`, `processed_date`, `comment`, `status`, `score`) VALUES ('ecb46906-a44f-4dda-bd4f-aa9353d35ff1', 'cf356185-d8ae-42b5-89d7-07bea0e53885', 1770804462937, 'Sim: 0.41, Skills: 0.00, Gap: 0.0 yrs -> Shortlist Prob: 0.44', 'Not Shortlisted', 57);

SET FOREIGN_KEY_CHECKS = 1;
