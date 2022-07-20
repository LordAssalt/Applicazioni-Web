import { Nav } from 'react-bootstrap';
import logo from './uni.svg';
import { Link, useLocation } from 'react-router-dom';

function HeaderPage(props) {
    const location = useLocation().pathname.substring(1);
    return (
        <>
            <Nav className="navbar navbar-dark navbar-expand-md bg-black navbar-padding mb-1">

                {/* Logo and title */}
                <div className="navbar-brand" href="#">
                    <Link to="/">
                        <img
                            alt=""
                            src={logo}
                            width="80"
                            height="80"
                            className="d-inline-block "
                        />
                    </Link>
                    {' '}
                    University Of AppWeb
                </div>


                {/* Login Button */}
                {location === "" ?
                    props.loggedIn ?
                        //Sono Loggato
                        <div className='ms-md-auto'>
                            <span className="navbar-text">
                                Ciao {props.user.name} !
                            </span>
                            &nbsp;&nbsp;
                            &nbsp;&nbsp;
                            <button type="button" className="btn btn-danger" onClick={() => props.doLogOut()}>Logout</button>
                            &nbsp;&nbsp;
                            &nbsp;&nbsp;
                        </div>
                        :
                        //Non sono Loggato
                        <div className='ms-md-auto'>
                            <Link to="/login">
                                <button type="button" className="btn btn-primary" >Login Page</button>
                            </Link>
                            &nbsp;&nbsp;
                            &nbsp;&nbsp;
                        </div>
                    : <div></div>
                }

            </Nav>
        </>
    );
};

export default HeaderPage;
