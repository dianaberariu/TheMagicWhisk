import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useGroceryContext } from '../../GroceryContext';

type GroceryItem = {
	id: string;
	name: string;
	amount?: string;
	isChecked: boolean;
};

type GroceryContextValue = {
	groceryList: GroceryItem[];
	toggleGroceryItem: (id: string) => void;
	removeGroceryItem: (id: string) => void;
	clearGroceryList: () => void;
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
	const { groceryList, toggleGroceryItem, removeGroceryItem, clearGroceryList } =
		useGroceryContext() as GroceryContextValue;
	const checkedCount = useMemo(
		() => groceryList.filter((item) => item.isChecked).length,
		[groceryList]
	);

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<View style={styles.headerRow}>
					<Text style={styles.title}>Grocery List</Text>
					{groceryList.length > 0 && (
						<TouchableOpacity
							style={styles.clearButton}
							activeOpacity={0.7}
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
							<Text style={styles.clearButtonText}>Clear All</Text>
						</TouchableOpacity>
					)}
				</View>
				<Text style={styles.subtitle}>
					{checkedCount}/{groceryList.length} items checked
				</Text>
				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
					{groceryList.length === 0 ? (
						<Text style={styles.emptyState}>
							Your grocery list is empty. Add a recipe from your cookbook!
						</Text>
					) : (
						groceryList.map((item) => (
							<TouchableOpacity
								key={item.id}
								style={styles.row}
								activeOpacity={0.8}
								onPress={() => toggleGroceryItem(item.id)}
							>
								<Ionicons
									name={item.isChecked ? 'checkmark-circle' : 'ellipse-outline'}
									size={22}
									color={item.isChecked ? COLORS.accent : COLORS.muted}
									style={styles.checkboxIcon}
								/>
								<View style={styles.itemTextWrap}>
									<Text
										style={[
											styles.itemText,
											item.isChecked && styles.itemTextChecked,
										]}
									>
										{item.name}
									</Text>
									<Text style={styles.itemAmount}>{item.amount}</Text>
								</View>
								<TouchableOpacity
									style={styles.deleteButton}
									activeOpacity={0.7}
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
		</SafeAreaView>
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
});
