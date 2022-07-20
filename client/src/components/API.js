const APIURL = new URL('http://localhost:3001/api/');

//------------------------------/LOGIN NEEDS/------------------------------//
async function logIn(credentials) {
    let response = await fetch(APIURL + 'sessions', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });
    if (response.ok) {
        const user = await response.json();
        return user;
    } else {
        const errDetail = await response.json();
        throw errDetail.message;
    }
}

async function logOut() {
    await fetch(new URL('sessions/current', APIURL), { method: 'DELETE', credentials: 'include' });
}

async function getUserInfo() {
    const response = await fetch(new URL('sessions/current', APIURL), { credentials: 'include' });
    const userInfo = await response.json();
    if (response.ok) {
        return userInfo;
    } else {
        throw userInfo;  // an object with the error coming from the server
    }
}
//---------------------------/END OF LOGIN NEEDS/---------------------------//


async function getAllCourses() {
    return new Promise((resolve, reject) => {
        fetch(new URL('courses', APIURL)).then((response) => {
            if (response.ok) {
                response.json().then((coursesJson) => {
                    resolve( coursesJson.map((c) => ({ coursecode: c.coursecode, name: c.name, maxstudents: c.maxstudents, subscribers: c.subscribers, preparatory: c.preparatory, credits: c.credits, incompatibilies: c.incompatibilies?.split(",") })))
                }).catch(err => reject({ error: "Cannot parse server response" }))
            } else {
                response.json().then(obj =>
                    reject(obj)) 
                    .catch(err => reject({ error: "Cannot parse server response" }))
            }
        }).catch(err => 
        reject ({ error: "Cannot Comunicate With Server!" }))
    }) 
}

async function getStudyPlan() {
    return new Promise((resolve, reject) => {
        fetch(new URL('studyplan', APIURL), { credentials: 'include' } ).then((response) => {
            if (response.ok) {
                response.json().then((coursesJson) => {
                    resolve( coursesJson.map((c) => ({ coursecode: c.coursecode, name: c.name, credits: c.credits })))
                }).catch(err => reject({ error: "Cannot parse server response" }))
            } else {
                response.json().then(obj =>
                    reject(obj))
                    .catch(err => reject({ error: "Cannot parse server response" }))
            }
        }).catch(err => 
        reject ({ error: "Cannot Comunicate With Server!" }))
    }) 
}

async function saveStudyPlan(studyPlanCodes, type) {
    return new Promise((resolve, reject) => {
        fetch(new URL('saveplan', APIURL), {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studyPlanCodes: studyPlanCodes, type: type }),
        }).then((response) => {
            if (response.ok) {
                resolve(null);
            } else {
                // analyze the cause of error
                response.json()
                    .then((message) => { reject(message); }) // error message in the response body
                    .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
            }
        }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
    });
}

async function deleteStudyPlan() {
    return new Promise((resolve, reject) => {
        fetch(new URL('deleteplan', APIURL), {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((response) => {
            if (response.ok) {
                resolve(null);
            } else {
                // analyze the cause of error
                response.json()
                    .then((message) => { reject(message); }) // error message in the response body
                    .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
            }
        }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
    });
}

async function updateStudyPlan(studyPlanCodesAdd, studyPlanCodesRem) {
    return new Promise((resolve, reject) => {
        fetch(new URL('saveplan', APIURL), {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studyPlanCodesAdd: studyPlanCodesAdd, studyPlanCodesRem: studyPlanCodesRem }),
        }).then((response) => {
            if (response.ok) {
                resolve(null);
            } else {
                // analyze the cause of error
                response.json()
                    .then((message) => { reject(message); }) // error message in the response body
                    .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
            }
        }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
    });
}


const API = { getAllCourses, logIn, logOut, getUserInfo, getStudyPlan, saveStudyPlan, deleteStudyPlan, updateStudyPlan }
export default API; 