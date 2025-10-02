import { logout } from '../auth'
export default function LogoutButton() { return <button onClick={() => logout()}>Logout</button> }