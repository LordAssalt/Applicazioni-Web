import { Container, Alert } from 'react-bootstrap';
import "bootstrap/js/src/collapse.js";
import CourseList from './coursetable';
import StudyPlanList from './studyplantable';

function MainPage(props) {

    return (
        <>
            <Container>
                <br />
                {props.loggedIn ?
                    <><StudyPlanList
                        existindb={props.existindb}
                        studyPlan={props.studyPlan}
                        user={props.user}
                        type={props.type}
                        setType={props.setType}
                        deleteFromStudyPlan={props.deleteFromStudyPlan}
                        cancelAllStudyPlan={props.cancelAllStudyPlan}
                        cancelLocalStudyPlan={props.cancelLocalStudyPlan}
                        setErrorUserMessage={props.setErrorUserMessage}
                        saveStudyPlan={props.saveStudyPlan}
                    />
                        <br />
                    </>
                    :
                    <></>
                }

                {props.errorUserMessage ?
                    <><Alert variant='danger'>{props.errorUserMessage}</Alert>  <br /><br /><br /> </>
                    :
                    <></>
                }

                <CourseList courses={props.courses}
                    loggedIn={props.loggedIn}
                    addToStudyPlan={props.addToStudyPlan}
                    checkStudyPlan={props.checkStudyPlan}
                    findCourseByCode={props.findCourseByCode}
                    setErrorUserMessage={props.setErrorUserMessage}
                    getIncompatibiliesAndPreparatory={props.getIncompatibiliesAndPreparatory}
                    user={props.user}
                    type={props.type}
                />
                <br />
            </Container>
        </>
    );


};


export default MainPage; 