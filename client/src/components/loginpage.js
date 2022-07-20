import { Form, Button, Alert, Container, Stack } from 'react-bootstrap';
import { useState } from 'react';
import logo from './uni.svg';
import { useNavigate } from 'react-router-dom';

function LoginForm(props) {
    const [username, setUsername] = useState('u1@p.it');
    const [password, setPassword] = useState('password');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        setErrorMessage('');
        const credentials = { username, password };
        let errMsg = 'Error(s) in the form, please fix it.'

        let valid = true;

        if (username === '' || password === '') {
            valid = false;
        }
        if (!username.includes("@")) {
            valid = false;
            errMsg = "Please, provide a valid mail address"
        }

        if (valid) {
            props.login(credentials);
        } else {
            setErrorMessage(errMsg)
        }

    };


    return (
        <Container fluid>
            <Stack gap={2} className="col-md-3 mx-auto">
                <h2>Login</h2>
                <br />
                <Form onSubmit={handleSubmit}>
                    <img
                        alt=""
                        src={logo}
                        width="150"
                        height="150"
                        className="d-inline-block "
                    />
                    {props.errorLoginMessage ? <Alert variant='danger'>{props.errorLoginMessage}</Alert> : ''}
                    {errorMessage ? <Alert variant='danger'>{errorMessage}</Alert> : ''}
                    <Form.Group controlId='username'>
                        <Form.Label>Email</Form.Label>
                        <Form.Control type='email' value={username} onChange={ev => setUsername(ev.target.value)} />
                    </Form.Group>
                    <br />
                    <Form.Group controlId='password'>
                        <Form.Label>Password</Form.Label>
                        <Form.Control type='password' value={password} onChange={ev => setPassword(ev.target.value)} />
                    </Form.Group>
                    <br />
                    <Button type='submit'>Login</Button>
                    &nbsp;&nbsp;
                    <Button variant="warning" onClick={() => navigate("/")}>Cancel</Button>
                </Form>
            </Stack>
        </Container >
    )
}

export { LoginForm };