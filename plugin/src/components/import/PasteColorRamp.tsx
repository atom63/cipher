import { Palette } from "lucide-react";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useState,
} from "react";
import {
	type ParsedRamp,
	type RampParseResult,
	parseColorRamp,
	rampsToTokens,
} from "../../parsers/color-ramp-parser";
import type { ParsedTokens } from "../../types/tokens";
import { useToast } from "../ui";
import styles from "./PasteColorRamp.module.css";

type Format = "tailwind" | "radix";

export interface PasteColorRampHandle {
	/** Number of importable colors (0 = nothing to import) */
	colorCount: number;
	/** Trigger the import */
	submit: () => void;
}

interface PasteColorRampProps {
	onCountChange?: (count: number) => void;
	onTokensParsed: (tokens: ParsedTokens) => void;
}

export const PasteColorRamp = forwardRef<
	PasteColorRampHandle,
	PasteColorRampProps
>(function PasteColorRamp({ onTokensParsed, onCountChange }, ref) {
	const [format, setFormat] = useState<Format>("tailwind");
	const [input, setInput] = useState("");
	const [radixLight, setRadixLight] = useState("");
	const [radixDark, setRadixDark] = useState("");
	const [nameOverrides, setNameOverrides] = useState<Record<string, string>>(
		{},
	);
	const { showError } = useToast();

	// Parse based on format
	const result: RampParseResult | null = useMemo(() => {
		if (format === "tailwind") {
			return input.trim() ? parseColorRamp(input) : null;
		}
		// Radix: parse light and dark separately
		const lightResult = radixLight.trim()
			? parseColorRamp(radixLight)
			: null;
		const darkResult = radixDark.trim() ? parseColorRamp(radixDark) : null;
		if (!lightResult && !darkResult) return null;

		const ramps: ParsedRamp[] = [];
		const errors = [
			...(lightResult?.errors ?? []),
			...(darkResult?.errors ?? []),
		];

		const allNames = new Set<string>();
		for (const r of lightResult?.ramps ?? []) allNames.add(r.name);
		for (const r of darkResult?.ramps ?? []) allNames.add(r.name);

		for (const name of allNames) {
			const lightRamp = lightResult?.ramps.find((r) => r.name === name);
			const darkRamp = darkResult?.ramps.find((r) => r.name === name);
			const modes: ParsedRamp["modes"] = [];
			if (lightRamp) modes.push({ name: "light", steps: lightRamp.steps });
			if (darkRamp) modes.push({ name: "dark", steps: darkRamp.steps });
			ramps.push({
				name,
				steps: lightRamp?.steps ?? darkRamp?.steps ?? [],
				modes,
			});
		}

		return { ramps, errors };
	}, [format, input, radixLight, radixDark]);

	const ramps = result?.ramps ?? [];
	const errors = result?.errors ?? [];
	const hasRamps = ramps.length > 0;

	const getDisplayName = useCallback(
		(ramp: ParsedRamp) => nameOverrides[ramp.name] ?? ramp.name,
		[nameOverrides],
	);

	const totalColors = ramps.reduce((sum, r) => {
		if (r.modes && r.modes.length > 0) {
			return (
				sum +
				r.modes.reduce(
					(ms, m) => ms + m.steps.filter((s) => s.color).length,
					0,
				)
			);
		}
		return sum + r.steps.filter((s) => s.color).length;
	}, 0);

	useEffect(() => {
		onCountChange?.(totalColors);
	}, [totalColors, onCountChange]);

	const handleImport = useCallback(() => {
		if (!hasRamps) return;

		const overrideMap = new Map<string, string>();
		for (const ramp of ramps) {
			const override = nameOverrides[ramp.name];
			if (override && override !== ramp.name) {
				overrideMap.set(ramp.name, override);
			}
		}

		const tokens = rampsToTokens(
			ramps,
			overrideMap.size > 0 ? overrideMap : undefined,
		);
		if (tokens.length === 0) {
			showError("No valid colors found to import");
			return;
		}

		const byCategory: Record<string, number> = {};
		for (const t of tokens) {
			byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
		}

		onTokensParsed({
			tokens,
			errors: errors.filter((e) => e.severity === "error"),
			stats: {
				total: tokens.length,
				byCategory,
				conflicts: 0,
				errors: errors.filter((e) => e.severity === "error").length,
			},
		});
	}, [hasRamps, ramps, nameOverrides, errors, onTokensParsed, showError]);

	useImperativeHandle(
		ref,
		() => ({
			colorCount: totalColors,
			submit: handleImport,
		}),
		[totalColors, handleImport],
	);

	const colorToHex = (color: {
		r: number;
		g: number;
		b: number;
		a?: number;
	}) => {
		const r = Math.round(color.r * 255);
		const g = Math.round(color.g * 255);
		const b = Math.round(color.b * 255);
		return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
	};

	return (
		<div className={styles.pasteRamp}>
			<div className={styles.formatSelector}>
				<button
					className={styles.formatOption}
					data-selected={format === "tailwind"}
					onClick={() => setFormat("tailwind")}
					type="button"
				>
					Tailwind
				</button>
				<button
					className={styles.formatOption}
					data-selected={format === "radix"}
					onClick={() => setFormat("radix")}
					type="button"
				>
					Radix
				</button>
			</div>

			{format === "tailwind" ? (
				<div className={styles.textareaWrapper}>
					<textarea
						className={styles.textarea}
						onChange={(e) => setInput(e.target.value)}
						placeholder={`Paste Tailwind CSS color variables…\n\n--color-blue-50: #eff6ff;\n--color-blue-500: #3b82f6;\n--color-blue-950: #172554;`}
						rows={8}
						spellCheck={false}
						value={input}
					/>
				</div>
			) : (
				<div className={styles.radixInputs}>
					<div className={styles.radixPane}>
						<label className={styles.radixLabel}>Light</label>
						<div className={styles.textareaWrapper}>
							<textarea
								className={styles.textarea}
								onChange={(e) => setRadixLight(e.target.value)}
								placeholder={`Paste light theme from Radix…\n\n:root, .light {\n  --gray-1: #fcfcfc;\n  …\n}`}
								rows={6}
								spellCheck={false}
								value={radixLight}
							/>
						</div>
					</div>
					<div className={styles.radixPane}>
						<label className={styles.radixLabel}>Dark</label>
						<div className={styles.textareaWrapper}>
							<textarea
								className={styles.textarea}
								onChange={(e) => setRadixDark(e.target.value)}
								placeholder={`Paste dark theme from Radix…\n\n.dark, .dark-theme {\n  --gray-1: #111111;\n  …\n}`}
								rows={6}
								spellCheck={false}
								value={radixDark}
							/>
						</div>
					</div>
				</div>
			)}

			{hasRamps && (
				<div className={styles.preview}>
					{ramps.map((ramp) => {
						const displayName = getDisplayName(ramp);
						const validSteps = ramp.steps.filter((s) => s.color);
						const hasModes = ramp.modes && ramp.modes.length > 0;

						return (
							<div className={styles.rampCard} key={ramp.name}>
								{/* Gradient bar */}
								{hasModes ? (
									<div className={styles.gradientStack}>
										{ramp.modes!.map((mode) => {
											const modeSteps = mode.steps.filter((s) => s.color);
											return (
												<div className={styles.gradientRow} key={mode.name}>
													<span className={styles.modeLabel}>{mode.name}</span>
													<div
														className={styles.gradientBar}
														title={modeSteps.map((s) => `${s.step}: ${s.value}`).join("\n")}
													>
														{modeSteps.map((s, i) => (
															<span
																className={styles.gradientSegment}
																key={s.step}
																style={{
																	backgroundColor: colorToHex(s.color!),
																	borderRadius:
																		i === 0
																			? "var(--radius-sm) 0 0 var(--radius-sm)"
																			: i === modeSteps.length - 1
																				? "0 var(--radius-sm) var(--radius-sm) 0"
																				: undefined,
																}}
															/>
														))}
													</div>
												</div>
											);
										})}
									</div>
								) : (
									<div
										className={styles.gradientBar}
										title={validSteps.map((s) => `${s.step}: ${s.value}`).join("\n")}
									>
										{validSteps.map((s, i) => (
											<span
												className={styles.gradientSegment}
												key={s.step}
												style={{
													backgroundColor: colorToHex(s.color!),
													borderRadius:
														i === 0
															? "var(--radius-sm) 0 0 var(--radius-sm)"
															: i === validSteps.length - 1
																? "0 var(--radius-sm) var(--radius-sm) 0"
																: undefined,
												}}
											/>
										))}
									</div>
								)}

								{/* Name + path */}
								<div className={styles.rampMeta}>
									<div className={styles.rampNameRow}>
										<span className={styles.rampPrefix}>color /</span>
										<input
											className={styles.rampNameInput}
											onChange={(e) =>
												setNameOverrides((prev) => ({
													...prev,
													[ramp.name]: e.target.value,
												}))
											}
											placeholder={ramp.name}
											spellCheck={false}
											value={displayName}
										/>
										<span className={styles.rampSuffix}>
											/ {hasModes ? "light" : validSteps[0]?.step} … {hasModes ? "dark" : validSteps[validSteps.length - 1]?.step}
										</span>
									</div>
									<span className={styles.stepCount}>
										{hasModes
											? ramp.modes!
													.map((m) => `${m.steps.filter((s) => s.color).length} ${m.name}`)
													.join(" · ")
											: `${validSteps.length} steps`}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{errors.length > 0 && (
				<div className={styles.errors}>
					{errors.slice(0, 5).map((e, i) => (
						<div className={styles.errorItem} key={i}>
							{e.message}
						</div>
					))}
					{errors.length > 5 && (
						<div className={styles.errorItem}>
							…and {errors.length - 5} more
						</div>
					)}
				</div>
			)}

			{!hasRamps &&
				((format === "tailwind" && input.trim()) ||
					(format === "radix" &&
						(radixLight.trim() || radixDark.trim()))) &&
				!errors.some((e) => e.severity === "error") && (
					<div className={styles.emptyHint}>
						<Palette size={16} />
						No color ramps detected.
					</div>
				)}
		</div>
	);
});
