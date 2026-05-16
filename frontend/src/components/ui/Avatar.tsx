import "@styles/components/ui/Avatar.scss"
import type { AvatarProps } from "./types"

function Avatar({ image, placeholder, color }: AvatarProps) {
    if(!image && !placeholder) return <></>

    if(!image && placeholder) {
        let split = placeholder.split(" ")
        let res = []
        for(let i = 0; i < Math.min(split.length, 2); i++) {
            if(split.length == 0) continue
            res.push(split[i][0])
        }

        placeholder = res.join("")
    }

    return (
        <div className="avatar" style={color ? { "--avatar-color": color } as React.CSSProperties : undefined}>
            {image ?
                <img src={image} alt={placeholder ?? ""}/>
            :
                <div className="avatar__placeholder">{placeholder}</div>
            }
        </div>
    )
}

export default Avatar