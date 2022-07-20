import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-notifications-component/dist/theme.css'
import { useEffect, useState } from 'react';
import API from './components/API';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ReactNotifications, Store } from 'react-notifications-component'
import MainPage from './components/mainpage';
import HeaderPage from './components/headerpage';
import { LoginForm } from './components/loginpage';

function App() {
  return (
    <Router>
      <App2 />
    </Router>
  )
}

function App2() {
  //------------------------------/LOGIN NEEDS/------------------------------//
  const [errorLoginMessage, setErrorLoginMessage] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);  // no user is logged in when app loads
  const [user, setUser] = useState({});

  const doLogIn = (credentials) => {
    API.logIn(credentials)
      .then(user => {
        //Pulisco il messaggio di errore
        setErrorLoginMessage('');
        //////////////////////////
        setType(parseInt(user.type,10));
        setLoggedIn(true);
        setNeedUpdate(true);
        setUser(user);
        navigate('/');
      })
      .catch(() => {
        setErrorLoginMessage('Incorrect Email and/or Password');
      }
      )
  }
  const doLogOut = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser({});
    //Pulisco il messaggio di errore
    setErrorLoginMessage('');
    setErrorUserMessage('');
    setExistInDb(false);
    setNeedUpdate(true);
    setType(0);
    //////////////////////////
    setStudyPlan([]);
    setStudyPlanOld([]);
  }
  //---------------------------/END OF LOGIN NEEDS/---------------------------//

  const navigate = useNavigate();
  const [errorUserMessage, setErrorUserMessage] = useState("");
  const [courses, setCourses] = useState([]);
  const [studyPlan, setStudyPlan] = useState([]);
  const [existindb, setExistInDb] = useState(false);
  const [needUpdate, setNeedUpdate] = useState(true);
  const [studyPlanOld, setStudyPlanOld] = useState([]);
  const [type, setType] = useState(0);

  useEffect(() => {
    if (loggedIn) {
      API.getStudyPlan()
        .then((plans) => {
          setStudyPlan(plans);
          if (plans.length) {
            setExistInDb(true);
            setStudyPlanOld(plans);
          } else {
            setExistInDb(false);
          }
        })
        .catch(err => handleErrors(err))
    }
  }, [loggedIn]);

  useEffect(() => {
    if (needUpdate) {
      API.getAllCourses()
        .then((courses) => {
          setCourses(courses);
          setNeedUpdate(false);
        })
        .catch(err => handleErrors(err))
    }
  }, [needUpdate]);

  //Attendo che react aggiorni studyPlan e solo quando ha fatto, ed è vuoto, metto il tipo del piano di studi a null
  useEffect(() => {
    if (!studyPlan.length) {
      setType(0);
    }
  }, [studyPlan.length])

  function handleErrors(err) {
    Store.addNotification({
      title: "Error!",
      message: err.error.toString() ,
      type: "danger",
      insert: "top",
      container: "top-right",
      animationIn: ["animate__animated", "animate__fadeIn"],
      animationOut: ["animate__animated", "animate__fadeOut"],
      dismiss: {duration: 3000,onScreen: true}
    });
  }

  function notifyWithPopup(headerText,bodyText,color){
    Store.addNotification({
      title: headerText,
      message: bodyText,
      type: color,
      insert: "top",
      container: "top-right",
      animationIn: ["animate__animated", "animate__fadeIn"],
      animationOut: ["animate__animated", "animate__fadeOut"],
      dismiss: { duration: 3000, onScreen: true }
    });
  }

  function deleteFromStudyPlan(course) {
    setStudyPlan(studyPlan.filter((c) => c.coursecode !== course.coursecode))
  }

  function addToStudyPlan(course) {
    course.status = 'added'
    setStudyPlan(oldcourse => [...oldcourse, course]);
  }

  function cancelAllStudyPlan() {
    setStudyPlan([]);
    setType(0);
    setExistInDb(false);
    setNeedUpdate(true);
    setStudyPlanOld([]);
    user.type = 0;
    setErrorUserMessage("");
    API.deleteStudyPlan().then(()=>{
     notifyWithPopup("Deleting Complete!","StudyPlan Correctly Deleted","success");
    }).catch(err => handleErrors(err));
  }

  function cancelLocalStudyPlan() {
    if (!existindb) {
      setStudyPlan([]);
      user.type = 0;
      setType(0);
      setNeedUpdate(true);
      setErrorUserMessage("");
    } else {
      setStudyPlan(studyPlanOld);
      //Faccio anche aggiornare la lista dei corsi
      setNeedUpdate(true);
      setErrorUserMessage("");
    }
    notifyWithPopup("Reset Complete!","Study Plan Correclty Resetted!","success");
  }

  function saveStudyPlan() {

    user.type = type;

    // Se il piano di studi esiste gia faccio una update
    if (existindb) {
      // courses_added trova solo i corsi aggiunti rispetto a quelli già scritti nel db
      const courses_added = studyPlan.filter((s1) => !studyPlanOld.find(s2 => s1.coursecode === s2.coursecode)).map(s => s.coursecode);

      // courses_removed trova solo i corsi rimossi rispetto a quelli del piano di studi nel db
      const courses_removed = studyPlanOld.filter((s2) => !studyPlan.find(s1 => s1.coursecode === s2.coursecode)).map(s => s.coursecode);

      if(courses_added.length || courses_removed.length){
      // Aggiorno il piano di studi
      API.updateStudyPlan(courses_added, courses_removed)
        .then(() => {
          // Setto i colori nulli dato che l'aggiornamento è andato a buon fine
          setStudyPlan(studyPlan.map((s) => s.status ? { ...s, status: '' } : s));
          // Aggiorno l'old studyplan andando a correggere i colori anche qua in quanto 
          // La setSomething essendo asincrona verrà eseguita non si sa quando
          setStudyPlanOld(studyPlan.map((s) => s.status ? { ...s, status: '' } : s));
          // Lancio la notifica
          notifyWithPopup("Updating Completed!","StudyPlan Correctly Updated","success");
        })
        .catch(err => handleErrors(err));
      // In questo modo eseguo l'aggiornamento della tabella corsi
      }else{
        notifyWithPopup("Warning!","Latest Version Of StudyPlan Already Saved","warning");
      }

    } else {

      const studyPlanCodes = studyPlan.map(s => s.coursecode);
      API.saveStudyPlan(studyPlanCodes, type)
        .then(() => {
          // Setto i colori nulli dato che l'aggiornamento è andato a buon fine
          setStudyPlan(studyPlan.map((s) => s.status ? { ...s, status: '' } : s));
          // Aggiorno lo stato che mi dice se l'ho salvato ed aggiorno anche l'oldStudyPlan perhè ormai
          // Quello salvato è old. Vado a correggere i colori anche qua nell'old in quanto 
          // La setSomething essendo asincrona verrà eseguita non si sa quando
          setStudyPlanOld(studyPlan.map((s) => s.status ? { ...s, status: '' } : s));
          setExistInDb(true);
          // Lancio la notifica
          notifyWithPopup("Saving Completed!","StudyPlan Correctly Saved","success");
        })
        .catch(err => handleErrors(err));
    }
    setNeedUpdate(true);

  }

  function getIncompatibiliesAndPreparatory(course) {
    let ret = { inc: [], prepa: [] }

    //Controllo se c'è un corso propedeutico ed in caso affermativo lo cerco
    if (course.preparatory) {
      courses.filter((c) => {
        if (c.coursecode === course.preparatory) {
          ret.prepa.push(c);
          return true;
        }
        return false;
      });
    }

    //Controllo se ci sono corsi incompatibili e li cerco
    if (course.incompatibilies) {
      courses.filter((c) => {
        if (course.incompatibilies.includes(c.coursecode)) {
          ret.inc.push(c);
        } return false;
      });
    }

    return ret;
  }

  function checkStudyPlan(course) {
    let ret = { check: false, reason: "" };

    //Controllo se il corso sta già nel piano di studi
    if (studyPlan.find(s => s.coursecode === course.coursecode)) {
      ret = { check: true, reason: "alreadyin" };
    }

    //Controllo eventuali esami che sono incompatibili
    if (course.incompatibilies && studyPlan.length) {
      if (studyPlan.find(s => course.incompatibilies.includes(s.coursecode))) {
        ret = { check: true, reason: "twincoursein" };
      }
    }

    //Controllo gli esami propedeutici
    if (course.preparatory && loggedIn) {
      if (!studyPlan.find(s => s.coursecode === course.preparatory)) {
        ret = { check: true, reason: "preparatory" };
      }
    }

    //Controllo gli iscritti
    if (course.subscribers === course.maxstudents) {
      ret = { check: true, reason: "maxsub" };
    }

    return ret;
  }

  return (
    <>
      <div className="app-container">
        <ReactNotifications />

        <HeaderPage loggedIn={loggedIn} user={user} doLogOut={doLogOut} />

        <Routes>
          <Route
            path='/'
            element={<MainPage
              existindb={existindb}
              courses={courses}
              user={user}
              type={type}
              setType={setType}
              loggedIn={loggedIn}
              studyPlan={studyPlan}
              cancelAllStudyPlan={cancelAllStudyPlan}
              errorUserMessage={errorUserMessage}
              setErrorUserMessage={setErrorUserMessage}
              deleteFromStudyPlan={deleteFromStudyPlan}
              cancelLocalStudyPlan={cancelLocalStudyPlan}
              addToStudyPlan={addToStudyPlan}
              checkStudyPlan={checkStudyPlan}
              saveStudyPlan={saveStudyPlan}
              getIncompatibiliesAndPreparatory={getIncompatibiliesAndPreparatory}
            />}
          />

          <Route
            path='/login'
            element={loggedIn ? <Navigate to='/' /> : <LoginForm login={doLogIn} errorLoginMessage={errorLoginMessage} />}
          />

        </Routes>
      </div>
    </>
  );
};

export default App;