import { Delete02Icon as Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function Delete02Icon(
	props: Omit<React.ComponentProps<typeof HugeiconsIcon>, "icon">,
) {
	return <HugeiconsIcon icon={Icon} {...props} />;
}
