import { login } from '../auth'
export default function LoginButton() { return <button onClick={() => login()}>Login / Sign up</button> }