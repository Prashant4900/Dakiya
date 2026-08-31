import { SidebarRightIcon as Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function SidebarRightIcon(
	props: Omit<React.ComponentProps<typeof HugeiconsIcon>, "icon">,
) {
	return <HugeiconsIcon icon={Icon} {...props} />;
}
