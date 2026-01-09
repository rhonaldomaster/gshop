import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../ui/GSText';

interface RecipientSearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  error?: string | null;
  placeholder?: string;
}

export const RecipientSearchInput: React.FC<RecipientSearchInputProps> = ({
  value,
  onChangeText,
  onSearch,
  isLoading,
  error,
  placeholder = 'Email o telefono del destinatario',
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = useCallback(() => {
    if (value.trim().length > 0 && !isLoading) {
      onSearch();
    }
  }, [value, isLoading, onSearch]);

  const isValidInput = value.trim().length >= 3;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error
              ? theme.colors.error
              : isFocused
              ? theme.colors.primary
              : theme.colors.border,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.icon}
        />
        <TextInput
          style={[
            styles.input,
            { color: theme.colors.text },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          editable={!isLoading}
        />
        {value.length > 0 && !isLoading && (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={styles.loader}
          />
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
          <GSText variant="caption" style={{ color: theme.colors.error, marginLeft: 4 }}>
            {error}
          </GSText>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.searchButton,
          {
            backgroundColor: isValidInput && !isLoading
              ? theme.colors.primary
              : theme.colors.gray300,
          },
        ]}
        onPress={handleSearch}
        disabled={!isValidInput || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.white} />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={20} color={theme.colors.white} />
            <GSText variant="body" weight="medium" color="white" style={{ marginLeft: 8 }}>
              Buscar destinatario
            </GSText>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.hintContainer}>
        <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
        <GSText variant="caption" color="textSecondary" style={{ marginLeft: 4, flex: 1 }}>
          Ingresa el email o numero de telefono de la persona a quien deseas transferir
        </GSText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 52,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  loader: {
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 4,
  },
});

export default RecipientSearchInput;
