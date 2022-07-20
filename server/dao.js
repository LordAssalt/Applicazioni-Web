'use strict';
let sqlite3 = require('sqlite3').verbose();
const dayjs = require('dayjs');
const crypto = require('crypto');

// open the database
const db = new sqlite3.Database('appweb.db', (err) => {
    if (err) throw err;
});

exports.getAllCourses = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM COURSES ORDER BY name';
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            const course = rows.map((c) => ({ coursecode: c.coursecode, name: c.name, maxstudents: c.maxstudents, subscribers: c.subscribers, preparatory: c.preparatory, credits: c.credits, incompatibilies:c.mismatch }));
            resolve(course);
        });
    });
};

exports.getStudyPlan = (userid) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT STUDYPLAN.coursecode, COURSES.name, COURSES.credits  FROM COURSES,STUDYPLAN ON COURSES.coursecode=STUDYPLAN.coursecode WHERE STUDYPLAN.id=? ORDER BY COURSES.name';
        db.all(sql,[userid], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            const studyplan = rows.map((c) => ({ coursecode: c.coursecode, name: c.name, credits:c.credits }));
            resolve(studyplan);
        });
    });
};

exports.saveStudyPlan =(courseid,userid)=>{
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO STUDYPLAN (coursecode,id) VALUES (?,?) ';
        db.run(sql,[courseid,userid], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

exports.deleteEntireStudyPlan=(userid)=>{
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM STUDYPLAN WHERE id = ?';
        db.run(sql, [userid], (err) => {
            if (err) {
                reject(err);
                return;
            } else
                resolve(null);
        });
    });
}

exports.deleteSingleCourseFromStudyPlan=(courseid,userid)=>{
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM STUDYPLAN WHERE id=? AND coursecode=? ';
        db.run(sql,[userid,courseid], (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

exports.updateStudentStatus=(userid,userstatus)=>{
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE STUDENTS SET type=? WHERE id=?';
        db.run(sql, [userstatus, userid], (err) => {
            if (err) {
                reject(err);
                return;
            } else
                resolve(null);
        });
    });
}

exports.updateEntireCourseSubscribers=(userid,num)=>{
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE COURSES SET subscribers=subscribers+? WHERE coursecode IN (SELECT coursecode FROM STUDYPLAN WHERE id=?)';
        db.run(sql, [num, userid], (err) => {
            if (err) {
                reject(err);
                return;
            } else
                resolve(null);
        });
    });
}

exports.updateSingleCourseSubscribers=(coursecode,num)=>{
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE COURSES SET subscribers=subscribers+? WHERE coursecode = ?';
        db.run(sql, [num, coursecode], (err) => {
            if (err) {
                reject(err);
                return;
            } else
                resolve(null);
        });
    });
}

//------------------------------/LOGIN NEEDS/------------------------------//
exports.getUserById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM STUDENTS WHERE id = ?';

        db.get(sql, [id], (err, row) => {
            if (err)
                reject(err);
            else if (row === undefined)
                resolve({ error: 'User not found.' });
            else {
                // by default, the local strategy looks for "username": not to create confusion in server.js, we can create an object with that property
                const user = { id: row.id, username: row.mail, name: row.name, type: row.type}
                resolve(user);
            }
        });
    });
};

exports.getUser = (mail, password) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM STUDENTS WHERE mail = ?';

        db.get(sql, [mail], (err, row) => {
            if (err) { reject(err); }
            else if (row === undefined) { resolve(false); }
            else {
                const user = { id: row.id, username: row.mail, name: row.name, type:row.type };
                const salt = row.salt;

                crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
                    if (err) reject(err);

                    const passwordHex = Buffer.from(row.hash, 'hex'); // row.hash has the hashed password

                    if (!crypto.timingSafeEqual(passwordHex, hashedPassword))
                        resolve(false);
                    else resolve(user);
                });
            }
        });
    });
};

//---------------------------/END OF LOGIN NEEDS/---------------------------//