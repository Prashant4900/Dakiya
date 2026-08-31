import { SidebarLeftIcon as Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function SidebarLeftIcon(
	props: Omit<React.ComponentProps<typeof HugeiconsIcon>, "icon">,
) {
	return <HugeiconsIcon icon={Icon} {...props} />;
}
