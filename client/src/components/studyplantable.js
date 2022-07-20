import { Table, Form } from 'react-bootstrap';
import "bootstrap/js/src/collapse.js";
import "./components.css"
const partime_max = 40;
const fulltime_max = 80;

function StudyPlanList(props) {

    function handleSubmit (){

        //Calcolo la somma dei CFU
        const tot=props.studyPlan.reduce((a, b) => a + (b.credits || 0), 0);

        //Controllo se full-time o part-time è stato scelto
        if(!props.type){
            props.setErrorUserMessage("Please, select your status before saving your study plan");
        }else{
            //Verifico il rispetto dei CFU
            const max_credits = ( props.type === 2 ? fulltime_max : (props.type ? partime_max : undefined));
            if ((tot<=max_credits ) && (tot>=(max_credits-20))){
                //Qui ho passato tutti i test
                props.setErrorUserMessage("");
                props.saveStudyPlan();
            }else{
                props.setErrorUserMessage("The sum of your credits is not in range");
            }
        }

    }

    return (
        <>
            <h1>Study Plan</h1>
            {!props.studyPlan.length ?
                <>
                    <br />
                    <h5>Your Study Plan is empty! Please create a new one.</h5>
                    <br />
                    <Form.Label>Before do that, please, select your status:</Form.Label>
                </>
                :
                <>
                    <Form.Label>Student status:</Form.Label>
                </>
            }

            <Form.Select
                className='w-25'
                value={props.type}
                onChange={ev => props.setType(parseInt(ev.target.value,10))} disabled={props.type ? true : false} >
                <option value={0}>-</option>
                <option value={2}>Full-Time</option>
                <option value={1}>Part-Time</option>
            </Form.Select>
            <br />

            {!props.studyPlan.length ?
                <>
                </>
                :
                <>
                    <h6>The sum of credits must be between {props.type === 2 ? fulltime_max : (props.type ? partime_max : "NaN")} and {props.type === 2 ? fulltime_max - 20 : (props.type ? partime_max -20 : "NaN")} </h6>
                    <br />
                    <Table className="table">
                        <thead>
                            <tr>
                                <th scope="col">Course Code</th>
                                <th scope="col">Course Name</th>
                                <th scope="col">Credits</th>
                                <th scope="col">#</th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.studyPlan.map((course) =>
                                <StudyPlanData
                                    course={course}
                                    studyPlan={props.studyPlan}
                                    key={course.coursecode}
                                    deleteFromStudyPlan={props.deleteFromStudyPlan}
                                />
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2}>
                                    Total Credits:
                                </td>
                                <td>
                                    {props.studyPlan.reduce((a, b) => a + (b.credits || 0), 0)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </Table>
                    <br />
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <button className="btn btn-success" onClick={() => {handleSubmit()}}>Save Study Plan</button>
                        {props.existindb ? <button className="btn btn-danger" onClick={() => { props.cancelAllStudyPlan() }}>Cancel Study Plan</button> : <></>} 
                        <button className="btn btn-warning" onClick={() => { props.cancelLocalStudyPlan() }}>Reset</button>
                    </div>
                    <br />
                </>
            }

        </>
    );
}

function StudyPlanData(props) {

    let rowColor=""
    let classTb = "btn btn-danger btn-sm"
    let dbt,dbp,t=""
    if (props.studyPlan.find(s => s.preparatory === props.course.coursecode)) {
        classTb = "btn btn-danger btn-sm disabled";
        dbt="tooltip" ;
        dbp="top";
        t="Preparatory Exam Still In Plan";
    }

    switch(props.course.status) {
        case 'added':
          rowColor = 'alert alert-warning';
          break;
        default:
          rowColor = '';
          break;
    }

    return (
        <>
            <tr className={rowColor}>
                <td>{props.course.coursecode}</td>
                <td>{props.course.name}</td>
                <td>{props.course.credits}</td>
                <td><div data-bs-toggle={dbt} data-bs-placement={dbp} title={t}><button type="button" className={classTb} onClick={() => props.deleteFromStudyPlan(props.course)}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="bi bi-trash" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                </svg></button></div></td>
            </tr>
        </>
    );

}


export default StudyPlanList;