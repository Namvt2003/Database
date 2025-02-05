const express = require('express');
const oracledb = require('oracledb');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;
const { v4: uuidv4 } = require('uuid');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const dbConfig = {
    user: 'system',
    password: 'Nam422003@',
    connectString: '192.168.85.1:1522/XEPDB1' 
};

app.post('/add_patient', async (req, res) => {
    let connection;

    try {
        console.log('Connecting to database...');
        connection = await oracledb.getConnection(dbConfig);
        console.log('Database connection successful.');

        const { phone_number, p_fname, p_lname, gender, dob, address, op_id, ip_id } = req.body;

        // In ra console các giá trị trước khi thêm vào cơ sở dữ liệu
        console.log('Preparing to insert patient data...');
        console.log('Phone Number:', phone_number);
        console.log('First Name:', p_fname);
        console.log('Last Name:', p_lname);
        console.log('Gender:', gender);
        console.log('DOB:', dob);
        console.log('Address:', address);
        console.log('OP ID:', op_id === 'Yes' ? 'Y' : 'N');
        console.log('IP ID:', ip_id === 'Yes' ? 'Y' : 'N');
        
        console.log('Inserting patient data into database...');
        const result = await connection.execute(
            `INSERT INTO Patient(phone_number, Fname, Lname, gender, DOB, address, OP_flag, IP_flag) VALUES (:phone_number, :Fname, :Lname, :gender, TO_DATE(:DOB, 'YYYY-MM-DD'), :address, :OP_flag, :IP_flag)`, 
            {
                phone_number: phone_number,
                Fname: p_fname,
                Lname: p_lname,
                gender,
                DOB: dob,
                address,
                OP_flag: op_id === 'Yes' ? 'Y' : 'N',
                IP_flag: ip_id === 'Yes' ? 'Y' : 'N'
            },
            { autoCommit: true }
        );
        console.log('Patient added successfully:', result);

        res.status(200).json({ message: "Patient added successfully", result });
    } catch (err) {
        console.error('Error during database operation:', err);
        res.status(500).json({ message: "Error adding patient", err });
    } finally {
        if (connection) {
            try {
                console.log('Closing database connection...');
                await connection.close();
                console.log('Database connection closed.');
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
});
app.post('/search_doctor', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT * FROM Employee WHERE Emp_id = :Emp_id AND Dr_flag = 'Y'`,
            { Emp_id: req.body.Emp_id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length > 0) {
            // Doctor found
            res.json({ found: true, doctor: result.rows[0] });
        } else {
            // Doctor not found
            res.json({ found: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});
app.post('/search_patient', async (req, res) => {
    let { ipId, opId, phoneNumber } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        let query, binds = {};

        if (ipId) {
            query = `SELECT * FROM Treatment WHERE IP_phone = :ipId`;      ///pls adjust this logic
            binds = { ipId };
        } else if (opId) {
            query = `SELECT * FROM Examination WHERE OP_phone = :opId`;
            binds = { opId };
        } else if (phoneNumber) {
            query = `SELECT * FROM Patient WHERE phone_number = :phoneNumber`;
            binds = { phoneNumber };
        } else {
            res.status(400).send({ error: 'No search parameters provided.' });
            return;
        }

        const result = await connection.execute(query, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
