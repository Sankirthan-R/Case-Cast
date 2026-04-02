import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ClickSpark from "../components/ClickSpark";
import FrostedLoginForm from "../components/FrostedLoginForm";
import StarBorder from "../components/StarBorder";

export default function Login() {
	const navigate = useNavigate();

	return (
		<ClickSpark
			sparkColor="rgba(201, 227, 255, 0.92)"
			sparkSize={9}
			sparkRadius={20}
			sparkCount={8}
			duration={430}
			easing="ease-out"
		>
			<main className="login-shell">
				<StarBorder
					as={motion.div}
					className="login-panel"
					initial={{ opacity: 0, scale: 0.9, y: 24 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					transition={{ duration: 0.55, ease: "easeOut" }}
					color="rgba(206, 229, 255, 0.9)"
					speed="8.2s"
					thickness={1.2}
				>
					<FrostedLoginForm
						title="Login"
						subtitle="Welcome to CaseCast"
						showHomeButton
						onHome={() => navigate("/")}
						onLogin={() => navigate("/app")}
						onSignup={() => navigate("/app")}
						onGoogleAuth={() => navigate("/app")}
					/>
				</StarBorder>
			</main>
		</ClickSpark>
	);
}
