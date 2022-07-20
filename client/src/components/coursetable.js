import { Table, Collapse } from 'react-bootstrap';
import { useState } from 'react';
import './components.css'
import { Store } from 'react-notifications-component'

function CourseList(props) {

    const handleAddClick = (course) => {
        props.setErrorUserMessage('');
        if (!props.type) {
            props.setErrorUserMessage('Please, select your status before creating your study plan');
            Store.addNotification({
                title: "Warning!",
                message: "Select Your Status",
                type: "warning",
                insert: "top",
                container: "top-right",
                animationIn: ["animate__animated", "animate__fadeIn"],
                animationOut: ["animate__animated", "animate__fadeOut"],
                dismiss: {duration: 3000,onScreen: true}
            });
        } else {
            props.setErrorUserMessage('');
            props.addToStudyPlan(course);
        }
    }

    return (
        <>
            <h1>Course List</h1>
            {props.loggedIn ? <TableLegend /> : <></>}
            <Table className={props.loggedIn ? "table table-sm" : "table"}>
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Course Code</th>
                        <th scope="col">Course Name</th>
                        <th scope="col">Max Students</th>
                        <th scope="col">Subscribed Students</th>
                        <th scope="col">Credits</th>
                        {props.loggedIn ? <th scope="col">Add</th> : <></>}
                    </tr>
                </thead>
                <tbody>
                    {props.courses.map((course) =>
                        <CreateRow
                            course={course}
                            type={props.type}
                            key={course.coursecode}
                            loggedIn={props.loggedIn}
                            handleAddClick={handleAddClick}
                            checkStudyPlan={props.checkStudyPlan}
                            getIncompatibiliesAndPreparatory={props.getIncompatibiliesAndPreparatory}
                        />
                    )}
                </tbody>
            </Table>
        </>
    );



    function CreateRow(props) {

        const [open, setOpen] = useState(false);
        let classTb = "btn btn-success btn-sm";
        let classTr = "";

        if (props.loggedIn) {
            const cond = props.checkStudyPlan(props.course)
            if (cond.check) {
                classTb = "btn btn-success btn-sm disabled";
                switch (cond.reason) {
                    case "preparatory":
                        if (props.type) {
                            classTr = "table-yellow";
                        } else {
                            classTb = "btn btn-success btn-sm";
                        }
                        break;
                    case "maxsub":
                        classTr = "table-red";
                        break;
                    case "twincoursein":
                        classTr = 'table-blue';
                        break;
                    case "alreadyin":
                        classTr = 'table-grey'
                        break;
                    default:
                        classTr = '';
                        break;
                }
            }
        }

        return (
            <>
                <tr className={classTr}>
                    <td>
                        <button type="button" className="btn btn-dark btn-sm"
                            onClick={() => setOpen(!open)}
                            aria-controls={props.course.coursecode}
                            aria-expanded={open}
                        >
                            {open ? "▲" : "▼"}
                        </button>
                    </td>
                    <td>{props.course.coursecode}</td>
                    <td>{props.course.name}</td>
                    <td>{props.course.maxstudents ? props.course.maxstudents : "Unlimited"}</td>
                    <td>{props.course.subscribers}</td>
                    <td>{props.course.credits}</td>
                    {props.loggedIn ? <><td><button type="button" className={classTb} onClick={() => props.handleAddClick(props.course)}>+</button></td></> : <></>}
                </tr>
                <Collapse in={open}>
                    <tr id={props.course.coursecode} >
                        <CreateHideContent
                            getIncompatibiliesAndPreparatory={props.getIncompatibiliesAndPreparatory}
                            course={props.course}
                        />
                    </tr>
                </Collapse>
            </>
        );

    }

    function TableLegend() {

        const [openl, setOpenl] = useState(false);

        return (
            <>
                <br />
                <button className="btn btn-info" type="button"
                    onClick={() => setOpenl(!openl)}
                    aria-controls={"Legend"}
                    aria-expanded={openl}>
                    Table Legend
                </button>

                <br />

                <Collapse in={openl}>
                    <div id="Legend">
                        <div className="col-6">
                            <div className="card card-body">
                                <h3 className="card-title">Legend</h3>
                                <Table className='table table-sm'>
                                    <tbody>
                                        <tr className='table-red'>
                                            <td>The course has reached the maximun number of subscribers</td>
                                        </tr>
                                        <tr className="table-yellow">
                                            <td>The course has a preparatory course that is not still selected</td>
                                        </tr>
                                        <tr className='table-blue'>
                                            <td>The course is not compatible with a course in your Study Plan </td>
                                        </tr>
                                        <tr className='table-grey'>
                                            <td>The course is still in your Study Plan</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </Collapse>
                <br />
            </>
        );
    }

    function CreateHideContent(props) {

        const infoC = props.getIncompatibiliesAndPreparatory(props.course);

        return (
            <>

                <td colSpan={7} >
                    <div className="card">
                        <div className="card-body">
                            <mark>Preparatory Exam Code:</mark>  {infoC.prepa.length ? " " + infoC.prepa[0].name + " (" + infoC.prepa[0].coursecode + ")" : " Any precedent course is requested for this course"} <br />
                            <mark>Incompatible Exams Code:</mark>  {infoC.inc.length ? " " + infoC.inc.map((i) => { return i.name + " (" + i.coursecode + ") " }) : " Any course is incompatible with this course"}
                        </div>
                    </div>
                </td>

            </>
        );
    }

}

export default CourseList;