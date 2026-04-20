import type { LogoProps } from "./types"

function Logo({ className }: LogoProps) {
    return (
        <img src="https://kantiana.ru/bitrix/templates/bfu.2023/images/svg/logo--short.svg"
          alt="BFU Logo"
          draggable={false}
          className={className ? className : ""}/>
    )
}

export default Logo