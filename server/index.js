'use strict';
const express = require('express');
const app = express();
const port = 3001;
const cors = require('cors');
const morgan = require('morgan'); // logging middleware
const passport = require('passport'); // auth middleware
const LocalStrategy = require('passport-local').Strategy; // username and password for login
const session = require('express-session'); // enable sessions
const { check, validationResult } = require('express-validator'); // validation middleware
const dao = require('./dao'); // module for accessing the DB


//---------------------------/LOGIN NEEDS/---------------------------//
/*** Set up Passport ***/
// set up the "username and password" login strategy by setting a function to verify username and password
passport.use(new LocalStrategy(
  function verify(username, password, done) {
    dao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { message: 'Incorrect username and/or password.' });

      return done(null, user); // valid credentials
    })
  }
));

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
  dao.getUserById(id)
    .then(user => {
      done(null, user); // this will be available in req.user
    }).catch(err => {
      done(err, null);
    });
});

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json());
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions));

// custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
    return next();
  return res.status(401).json({ error: 'not authenticated' });
}


// set up the session
app.use(session({
  // by default, Passport uses a MemoryStore to keep track of the sessions
  secret: '- it is a secret -',
  resave: false,
  saveUninitialized: false
}));

// then, init passport
app.use(passport.initialize());
app.use(passport.session());
//---------------------------/END OF LOGIN NEEDS/---------------------------//

function checkStudyPlan(studyPlanCodes, courses, type) {
  let ret = { check: false, reason: "" };
  const coursecodes = courses.map(c => c.coursecode);
  const unique = Array.from(new Set(studyPlanCodes));

  //Controllo che tutti i corsi passati appartengano ai corsi offerti
  if (studyPlanCodes.find(s => !coursecodes.includes(s))) {
    ret = {
      check: true, reason: "The course is not offered by the University"
    };
  }

  //Solo se tutti appartengono ai corsi offerti allora creo lo studyPlan
  const studyPlan = courses.filter(c => { if (studyPlanCodes.includes(c.coursecode)) { return c } });

  //Controllo che non ci siano doppioni
  if (studyPlanCodes.length !== unique.length) {
    ret = { check: true, reason: "The courses are duplicated" };
  }

  //Controllo che un corso non abbia dei corsi vietati nello studyplan
  studyPlan.forEach(s => {
    if (s.incompatibilies) {
      if (studyPlanCodes.find(sc => s.incompatibilies.includes(sc))) {
        ret = { check: true, reason: "Two courses in StudyPlan cannot be selected at the same time " };
      }
    }
  });

  //Controllo che i corsi propedeutici siano rispettai
  studyPlan.forEach(s => {
    if (s.preparatory) {
      if (!studyPlanCodes.includes(s.preparatory)) {
        ret = { check: true, reason: "Some courses requested are not in the plan" };
      }
    }
  });

  //Controllo la somma dei corsi
  const credits = studyPlan.reduce((a, b) => a + (b.credits || 0), 0);
  if (type === 2) {
    if (credits < 60 || credits > 80) {
      ret = { check: true, reason: "Credits Not In Range" };
    }
  } else if (type === 1) {
    if (credits < 20 || credits > 40) {
      ret = { check: true, reason: "Credits Not In Range" };
    }
  } else {
    ret = { check: true, reason: "Study Plan Type not defined" };
  }

  return ret;
}

function checkSubscribers(studyPlanCodes, courses){
  //E' una funzione diversa perchè deve essere chiamata solo sui nuovi corsi
  let ret = { check: false, reason: "" };
  const studyPlan = courses.filter(c => { if (studyPlanCodes.includes(c.coursecode)) { return c } });

  //Controllo gli iscritti
  studyPlan.forEach(c => {
    if (c.subscribers === c.maxstudents) {
      ret = { check: true, reason: "One or more courses have reached the maximum students number " };
    }
  });

  return ret
}
//----------------------------/APP API/---------------------------//
// GET Courses /api/courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await dao.getAllCourses();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'The Service Is Temporary Unavaliable, Please Try Again Later!' }).end();
  }
});

// GET StudyPlan /api/studyplan
app.get('/api/studyplan', isLoggedIn, [], async (req, res) => {
  try {
    const plan = await dao.getStudyPlan(req.user.id);
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Error While Loading You StudyPlan, Please Refresh The Page' }).end();
  }
});

// POST StudyPlan /api/saveplan
app.post('/api/saveplan', isLoggedIn,
  [
    check('type').isInt({ min: 1, max: 2 }),
    check('studyPlanCodes').not().isEmpty(),
    check('studyPlanCodes.*').isLength({ min: 7, max: 7 })
  ], async (req, res) => {

    //Inizializzo le variabili per trovare errori ed eseguo anche le check
    const error_check = validationResult(req);
    const courses = await dao.getAllCourses();
    const splans = await dao.getStudyPlan(req.user.id);

    // Controllo se viene chiamata POST saveplan su un utente con un piano di studi già definito
    if(splans.length){
      res.status(500).json({ error: 'Fatal Error, You Have Already A Saved StudyPlan' }).end();
    }

    let error_map = false;

    //Custom Validator
    const err_vincoli = checkStudyPlan(req.body.studyPlanCodes, courses, parseInt(req.body.type, 10));
    const err_iscritti=checkSubscribers(req.body.studyPlanCodes,courses);

    if (err_vincoli.check || err_iscritti.check) {
      err_vincoli.check ? res.status(500).json({ error: err_vincoli.reason }).end() : res.status(500).json({ error: err_iscritti.reason }).end();
    } else {
      if (!error_check.errors.length) {
        await Promise.all(req.body.studyPlanCodes.map(async (s) => {
          //Scrivo le info nel DB
          try {
            await dao.saveStudyPlan(s, req.user.id);
            await dao.updateSingleCourseSubscribers(s, +1);
          } catch (err) {
            error_map = err;
            res.status(500).json({ error: 'Fatal Error while Saving Exams, Please Contact the HelpDesk' }).end();
          }
        }));


        try {
          await dao.updateStudentStatus(req.user.id, req.body.type);
        } catch (err) {
          error_map = err;
          res.status(500).json({ error: 'Fatal Error while Saving Study Plan, Please Contact the HelpDesk' }).end();
        }

        if (error_map === false) {
          res.status(201).end()
        }

      } else {
        res.status(500).json({ error: 'Body Request Error!' }).end();
      }
    }

});

// UPDATE Studyplan /api/saveplan 
app.put('/api/saveplan', isLoggedIn,[], async (req, res) => {
    const studyPlanCodesRem = req.body.studyPlanCodesRem;
    const studyPlanCodesAdd = req.body.studyPlanCodesAdd;
    const courses = await dao.getAllCourses();
    const user = await dao.getUserById(req.user.id);

    let studyPlanCods = await dao.getStudyPlan(req.user.id);
    let error = false;

    studyPlanCods = studyPlanCods.map(s => s.coursecode).concat(studyPlanCodesAdd).filter(s => !studyPlanCodesRem.includes(s));

    //Chiamo la funzione di verifica
    const err_vincoli = checkStudyPlan(studyPlanCods, courses, user.type);
    //Controllo gli iscritti solo per quelli aggiunti
    const err_iscritti = checkSubscribers(studyPlanCodesAdd,courses);

    if (err_vincoli.check || err_iscritti.check) {
      err_vincoli.check ? res.status(500).json({ error: err_vincoli.reason }).end() : res.status(500).json({ error: err_iscritti.reason }).end();
    } else {
      if (studyPlanCodesAdd.length) {
        //Scrivo Gli Esami da Aggiungere Nel DB
        await Promise.all(studyPlanCodesAdd.map(async (s) => {
          try {
            await dao.saveStudyPlan(s, req.user.id);
            await dao.updateSingleCourseSubscribers(s, +1);
          } catch (err) {
            error = err;
            res.status(500).json({ error: 'Fatal Error while Saving Exams, Please Contact the HelpDesk' }).end();
          }
        }));

        if (error === false) {
          res.status(200).end();
        }
      }

      if (studyPlanCodesRem.length) {
        //Cancello Gli Esami da Togliere Dal DB
        await Promise.all(studyPlanCodesRem.map(async (s) => {
          try {
            dao.deleteSingleCourseFromStudyPlan(s, req.user.id)
            dao.updateSingleCourseSubscribers(s, -1);
          } catch (err) {
            error = err;
            res.status(500).json({ error: 'Exams Not Deleted, Fatal DB Error!' }).end();
          }
        }));
        if (error === false) {
          res.status(200).end();
        }
      }
    }
});

// DELETE Studyplan /api/deleteplan
app.delete('/api/deleteplan', isLoggedIn, [], async (req, res) => {
  try {
    await dao.updateEntireCourseSubscribers(req.user.id, -1);
    await dao.deleteEntireStudyPlan(req.user.id);
    await dao.updateStudentStatus(req.user.id, 0);
    res.status(200).end();
  } catch (err) {
    res.status(503).json({ error: `Fatal Database Error during the deletion of StudyPlan` });
  }

});

//------------------------------/LOGIN NEEDS/------------------------------//
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json(info);
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser()
      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE /sessions/current 
// logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => { res.end(); });
});

// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else
    res.status(401).json({ error: 'Unauthenticated user!' });
});
//---------------------------/END OF LOGIN NEEDS/---------------------------//

// Activate the server
app.listen(port, () => {
  console.log(`react-studyplan-server listening at http://localhost:${port}`);
});