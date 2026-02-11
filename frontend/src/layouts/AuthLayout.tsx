import "@styles/auth/AuthPage.scss"
import randomImg from "@assets/nevskogo.jpg"
import randomImg2 from "@assets/chernysh.webp"
import { Outlet } from "react-router"

function AuthLayout() {
	const imgs = [ randomImg, randomImg2 ]
	const rand = Math.floor(Math.random() * imgs.length)

	return (
		<div className="auth">
			<img src={imgs[rand]} alt="" draggable={false}/>
			<div className="auth__content">
				<div className="login-card">
					<img src="https://kantiana.ru/bitrix/templates/bfu.2023/images/svg/logo--short.svg" alt="BFU Logo" draggable={false} className="login-card__logo"/>
					<Outlet />
				</div>
			</div>
		</div>
	)
}

export default AuthLayout