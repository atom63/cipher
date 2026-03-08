import { RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, RadioGroup, SectionHeader, useToast } from "../components/ui";
import { useFigmaMessage, usePostMessage } from "../hooks/useFigmaMessage";
import type { PluginSettings } from "../types/messages";

const DEFAULT_SETTINGS: PluginSettings = {
	colorFormat: "oklch",
	lastExportTab: "variables",
	theme: "light",
};

export function SettingsPage() {
	const [settings, setSettings] = useState<PluginSettings>(DEFAULT_SETTINGS);
	const postMessage = usePostMessage();
	const { showSuccess } = useToast();

	// Load saved settings on mount
	useEffect(() => {
		postMessage({ type: "load-settings" });
	}, [postMessage]);

	useFigmaMessage((msg) => {
		if (msg.type === "settings-loaded") {
			const loaded = { ...DEFAULT_SETTINGS, ...msg.data };
			setSettings(loaded);
		}
	});

	const handleSave = () => {
		postMessage({ type: "save-settings", data: settings });
		showSuccess("Settings saved");
	};

	const handleReset = () => {
		setSettings(DEFAULT_SETTINGS);
		postMessage({ type: "save-settings", data: DEFAULT_SETTINGS });
		showSuccess("Settings reset to defaults");
	};

	return (
		<div className="settings-page">
			<SectionHeader
				variant="primary"
				title="Settings"
				description="Configure plugin preferences"
			/>

			<div className="settings-content">
				{/* Color Format */}
				<section className="settings-section">
					<h3>Export</h3>

					<RadioGroup
						label="Default Color Format"
						description="Format used when exporting color values"
						name="colorFormat"
						value={settings.colorFormat}
						onChange={(value: string) =>
							setSettings({
								...settings,
								colorFormat: value as PluginSettings["colorFormat"],
							})
						}
						options={[
							{
								value: "oklch",
								label: "OKLCH",
								description: "Perceptual color space (recommended)",
							},
							{
								value: "hex",
								label: "HEX",
								description: "#RRGGBB format",
							},
							{
								value: "rgba",
								label: "RGBA",
								description: "RGB with alpha channel",
							},
							{
								value: "hsl",
								label: "HSL",
								description: "Hue, saturation, lightness",
							},
						]}
					/>
				</section>
			</div>

			{/* Actions */}
			<div className="settings-actions">
				<Button variant="ghost" onClick={handleReset}>
					<RotateCcw size={14} />
					Reset to Defaults
				</Button>
				<Button variant="primary" onClick={handleSave}>
					<Save size={14} />
					Save Settings
				</Button>
			</div>
		</div>
	);
}
