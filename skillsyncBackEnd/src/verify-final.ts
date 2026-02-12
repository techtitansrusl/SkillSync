
import axios from 'axios';

const API_URL = 'http://localhost:4000';

async function verify() {
    const email = `final_verifier_${Date.now()}@example.com`;
    console.log(`Step 1: Registering user with email: ${email}`);

    try {
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            name: "Final Verifier",
            email: email,
            password: "Password123",
            role: "RECRUITER",
            companyName: "Final Verification Corp"
        });

        console.log("Registration successful");
        const token = regRes.data.token;
        const userId = regRes.data.user.id;

        console.log("Step 2: Posting a job with a VERY long description");
        const longDescription = "A".repeat(5000); // 5000 characters to definitely test the limit

        const jobRes = await axios.post(`${API_URL}/jobs`, {
            title: "Long Description AI Engineer",
            description: longDescription,
            location: "Remote",
            salary: 120000.50,
            qualifications: ["Expertise in Node.js"],
            skills: ["TypeScript", "Prisma"]
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Job posting successful! Job ID:", jobRes.data.id);

        // Clean up
        console.log("Step 3: Verifying job exists in DB");
        const getRes = await axios.get(`${API_URL}/jobs?recruiterId=${userId}`);
        const jobs = getRes.data;
        if (jobs.some((j: any) => j.id === jobRes.data.id)) {
            console.log("Verification SUCCESS: Job with long description found in recruiter's list");
        } else {
            console.log("Verification FAILURE: Job not found in recruiter's list");
        }

    } catch (error: any) {
        console.error("Verification failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
        process.exit(1);
    }
}

verify();
