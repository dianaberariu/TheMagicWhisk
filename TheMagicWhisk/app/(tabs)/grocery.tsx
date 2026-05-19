import React, { useMemo } from 'react';
import ScreenBackground from '../../components/ScreenBackground';
import { Ionicons } from '@expo/vector-icons';
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useGroceryContext } from '../../GroceryContext';
import { useThemeContext } from '../../context/ThemeContext';

type GroceryItem = {
	id: string;
	name: string;
	is_completed: boolean;
	user_id: string;
};

type GroceryContextValue = {
	groceryList: GroceryItem[];
	isLoading: boolean;
	isMutating: boolean;
	toggleGroceryItem: (id: string) => Promise<void>;
	removeGroceryItem: (id: string) => Promise<void>;
	clearGroceryList: () => Promise<void>;
};

const COLORS = {
	background: '#FFFFFF',
	text: '#111827',
	muted: '#6B7280',
	border: '#E5E7EB',
	accent: '#65B891',
	mutedChecked: '#A0A0A0',
};

export default function GroceryScreen() {
	const { isDarkMode } = useThemeContext();
	const {
		groceryList,
		isLoading,
		isMutating,
		toggleGroceryItem,
		removeGroceryItem,
		clearGroceryList,
	} =
		useGroceryContext() as GroceryContextValue;
	const checkedCount = useMemo(
		() => groceryList.filter((item) => item.is_completed).length,
		[groceryList]
	);
	const palette = isDarkMode
		? {
				surface: '#1A1A1A',
				border: '#2C3230',
				text: '#F5F7F8',
				muted: '#A9B0B2',
				subtle: '#232323',
			}
		: {
				surface: '#FFFFFF',
				border: '#E5E7EB',
				text: '#111827',
				muted: '#6B7280',
				subtle: '#F9FAFB',
			};

	if (isLoading && groceryList.length === 0) {
		return (
			<ScreenBackground>
				<View style={styles.loadingState}>
					<ActivityIndicator size="large" color={COLORS.accent} />
					<Text style={[styles.loadingText, { color: palette.muted }]}>Syncing your groceries...</Text>
				</View>
			</ScreenBackground>
		);
	}

	return (
			<ScreenBackground>
			<View style={styles.container}>
				<View style={styles.headerRow}>
						<Text style={[styles.title, { color: palette.text }]}>Grocery List</Text>
					{groceryList.length > 0 && (
						<TouchableOpacity
								style={[
									styles.clearButton,
									{ backgroundColor: palette.surface, borderColor: palette.border },
								]}
							activeOpacity={0.7}
							disabled={isMutating}
							onPress={() =>
								Alert.alert(
									'Clear List',
									'Are you sure you want to clear your entire list?',
									[
										{ text: 'Cancel', style: 'cancel' },
										{ text: 'Clear All', style: 'destructive', onPress: clearGroceryList },
									]
								)
							}
						>
								<Text style={[styles.clearButtonText, { color: palette.text }]}>Clear All</Text>
						</TouchableOpacity>
					)}
				</View>
					<Text style={[styles.subtitle, { color: palette.muted }]}> 
					{checkedCount}/{groceryList.length} items checked
				</Text>
				{isLoading && groceryList.length > 0 && (
					<View style={styles.syncRow}>
						<ActivityIndicator size="small" color={COLORS.accent} />
							<Text style={[styles.syncText, { color: palette.muted }]}>Updating your list...</Text>
					</View>
				)}
				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
					{groceryList.length === 0 ? (
						  <Text style={[styles.emptyState, { color: palette.muted }] }>
							Your grocery list is empty. Add ingredients from a recipe to save them here.
						</Text>
					) : (
						groceryList.map((item) => (
							<TouchableOpacity
								key={item.id}
												style={[
													styles.row,
													{ borderBottomColor: palette.border },
												]}
								activeOpacity={0.8}
								disabled={isMutating}
								onPress={() => toggleGroceryItem(item.id)}
							>
																<Ionicons
									name={item.is_completed ? 'checkmark-circle' : 'ellipse-outline'}
									size={22}
									color={item.is_completed ? COLORS.accent : COLORS.muted}
									style={styles.checkboxIcon}
								/>
								<View style={styles.itemTextWrap}>
									<Text
																		style={[
																			styles.itemText,
																			{ color: palette.text },
																			item.is_completed && styles.itemTextChecked,
																		]}
									>
										{item.name}
									</Text>
																		<Text style={[styles.itemAmount, { color: palette.muted }]}>
										{item.is_completed ? 'Completed' : 'Tap to mark complete'}
									</Text>
								</View>
								<TouchableOpacity
									style={styles.deleteButton}
									activeOpacity={0.7}
									disabled={isMutating}
									onPress={(event) => {
										event.stopPropagation();
										removeGroceryItem(item.id);
									}}
								>
									<Ionicons name="trash-outline" size={18} color={COLORS.muted} />
								</TouchableOpacity>
							</TouchableOpacity>
						))
					)}
						</ScrollView>
					</View>
				</ScreenBackground>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	container: {
		flex: 1,
		padding: 20,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	title: {
		fontSize: 22,
		fontWeight: '700',
		color: COLORS.text,
		marginBottom: 6,
	},
	clearButton: {
		paddingLeft: 12,
		paddingVertical: 6,
	},
	clearButtonText: {
		fontSize: 13,
		fontWeight: '600',
		color: '#A06B6B',
	},
	subtitle: {
		fontSize: 13,
		color: COLORS.muted,
		marginBottom: 18,
	},
	list: {
		paddingBottom: 16,
	},
	syncRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 14,
	},
	syncText: {
		fontSize: 12,
		color: COLORS.muted,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
	},
	checkboxIcon: {
		marginRight: 12,
	},
	itemTextWrap: {
		flex: 1,
	},
	itemText: {
		fontSize: 16,
		color: COLORS.text,
		marginBottom: 4,
	},
	itemTextChecked: {
		textDecorationLine: 'line-through',
		color: COLORS.mutedChecked,
	},
	itemAmount: {
		fontSize: 13,
		color: COLORS.muted,
	},
	deleteButton: {
		paddingLeft: 12,
		paddingVertical: 6,
	},
	emptyState: {
		fontSize: 14,
		color: COLORS.muted,
		lineHeight: 20,
		paddingVertical: 20,
	},
	loadingState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 14,
		color: COLORS.muted,
	},
});
