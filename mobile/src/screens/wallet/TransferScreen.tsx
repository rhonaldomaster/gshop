import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import RecipientSearchInput from '../../components/wallet/RecipientSearchInput';
import RecipientCard from '../../components/wallet/RecipientCard';
import TransferAmountInput from '../../components/wallet/TransferAmountInput';
import TransferPreview from '../../components/wallet/TransferPreview';
import TransferSuccess from '../../components/wallet/TransferSuccess';
import {
  transferService,
  SearchUserResult,
  TransferLimits,
  TransferPreviewResponse,
  TransferExecuteResponse,
} from '../../services/transfer.service';
import { paymentsService, WalletBalance } from '../../services/payments.service';

type TransferStep = 'search' | 'amount' | 'preview' | 'success';

export default function TransferScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  // State
  const [currentStep, setCurrentStep] = useState<TransferStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [recipient, setRecipient] = useState<SearchUserResult | null>(null);
  const [recipientConfirmed, setRecipientConfirmed] = useState(false);

  const [amount, setAmount] = useState(0);
  const [amountError, setAmountError] = useState<string | null>(null);

  const [limits, setLimits] = useState<TransferLimits | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);

  const [preview, setPreview] = useState<TransferPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [transferResult, setTransferResult] = useState<TransferExecuteResponse | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    try {
      const [walletData, limitsData] = await Promise.all([
        paymentsService.getWalletBalance(),
        transferService.getTransferLimits(),
      ]);
      setBalance(walletData);
      setLimits(limitsData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cargar la informacion');
    }
  };

  // Search for recipient
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setRecipient(null);
    setRecipientConfirmed(false);

    try {
      const result = await transferService.searchUser(searchQuery.trim());
      if (result) {
        setRecipient(result);
      } else {
        setSearchError('No se encontro un usuario con esos datos');
      }
    } catch (error: any) {
      setSearchError(error.message || 'Error al buscar usuario');
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  // Confirm recipient and move to amount step
  const handleConfirmRecipient = useCallback(() => {
    setRecipientConfirmed(true);
    setCurrentStep('amount');
  }, []);

  // Cancel recipient selection
  const handleCancelRecipient = useCallback(() => {
    setRecipient(null);
    setRecipientConfirmed(false);
    setSearchQuery('');
  }, []);

  // Handle amount change
  const handleAmountChange = useCallback((value: number) => {
    setAmount(value);
    setAmountError(null);

    if (value > 0 && limits && balance) {
      const validation = transferService.validateAmount(
        value,
        limits,
        balance.tokenBalance
      );
      if (!validation.valid) {
        setAmountError(validation.error || null);
      }
    }
  }, [limits, balance]);

  // Proceed to preview
  const handleProceedToPreview = useCallback(async () => {
    if (!recipient || amount <= 0 || !limits || !balance) return;

    const validation = transferService.validateAmount(amount, limits, balance.tokenBalance);
    if (!validation.valid) {
      setAmountError(validation.error || null);
      return;
    }

    setPreviewLoading(true);
    try {
      const previewData = await transferService.getTransferPreview({
        toUserId: recipient.userId,
        amount,
      });
      setPreview(previewData);
      setCurrentStep('preview');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo obtener el preview');
    } finally {
      setPreviewLoading(false);
    }
  }, [recipient, amount, limits, balance]);

  // Execute transfer
  const handleExecuteTransfer = useCallback(async () => {
    if (!recipient || amount <= 0) return;

    setTransferLoading(true);
    try {
      const result = await transferService.executeTransfer({
        toUserId: recipient.userId,
        amount,
      });
      setTransferResult(result);
      setCurrentStep('success');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo completar la transferencia');
    } finally {
      setTransferLoading(false);
    }
  }, [recipient, amount]);

  // Go back to previous step
  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'amount':
        setCurrentStep('search');
        break;
      case 'preview':
        setCurrentStep('amount');
        setPreview(null);
        break;
      default:
        navigation.goBack();
    }
  }, [currentStep, navigation]);

  // Reset for new transfer
  const handleNewTransfer = useCallback(() => {
    setCurrentStep('search');
    setSearchQuery('');
    setRecipient(null);
    setRecipientConfirmed(false);
    setAmount(0);
    setAmountError(null);
    setPreview(null);
    setTransferResult(null);
    loadInitialData();
  }, []);

  // Done - go back to wallet
  const handleDone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Get step progress
  const getStepNumber = () => {
    switch (currentStep) {
      case 'search':
        return 1;
      case 'amount':
        return 2;
      case 'preview':
        return 3;
      case 'success':
        return 4;
      default:
        return 1;
    }
  };

  // Render content based on current step
  const renderContent = () => {
    switch (currentStep) {
      case 'search':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Ionicons name="person-add" size={32} color={theme.colors.primary} />
              <GSText variant="h3" weight="bold" style={{ marginTop: 12 }}>
                A quien envias?
              </GSText>
              <GSText variant="body" color="textSecondary" style={{ marginTop: 4 }}>
                Busca por email o numero de telefono
              </GSText>
            </View>

            {!recipient ? (
              <RecipientSearchInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSearch={handleSearch}
                isLoading={searchLoading}
                error={searchError}
              />
            ) : (
              <RecipientCard
                recipient={recipient}
                onConfirm={handleConfirmRecipient}
                onCancel={handleCancelRecipient}
                isConfirmed={recipientConfirmed}
              />
            )}
          </View>
        );

      case 'amount':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Ionicons name="cash" size={32} color={theme.colors.primary} />
              <GSText variant="h3" weight="bold" style={{ marginTop: 12 }}>
                Cuanto deseas enviar?
              </GSText>
            </View>

            {recipient && (
              <View style={{ marginBottom: 24 }}>
                <RecipientCard
                  recipient={recipient}
                  onConfirm={() => {}}
                  onCancel={handleCancelRecipient}
                  isConfirmed={true}
                />
              </View>
            )}

            {limits && balance && (
              <TransferAmountInput
                value={amount}
                onChangeValue={handleAmountChange}
                limits={limits}
                balance={balance.tokenBalance}
                error={amountError}
              />
            )}

            <View style={styles.actionContainer}>
              <GSButton
                title="Continuar"
                onPress={handleProceedToPreview}
                loading={previewLoading}
                disabled={amount <= 0 || !!amountError || previewLoading}
                style={styles.continueButton}
              />
            </View>
          </View>
        );

      case 'preview':
        return (
          <View style={styles.stepContent}>
            {preview && (
              <TransferPreview
                preview={preview}
                onConfirm={handleExecuteTransfer}
                onCancel={handleBack}
                isLoading={transferLoading}
              />
            )}
          </View>
        );

      case 'success':
        return transferResult && recipient ? (
          <TransferSuccess
            result={transferResult}
            recipientName={`${recipient.firstName} ${recipient.lastName}`}
            onDone={handleDone}
            onNewTransfer={handleNewTransfer}
          />
        ) : null;

      default:
        return null;
    }
  };

  // Show login prompt for guests
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <GSText variant="h3" weight="bold">
            Enviar Dinero
          </GSText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={60} color={theme.colors.textSecondary} />
          <GSText variant="h3" weight="bold" style={styles.emptyTitle}>
            Inicia Sesion
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.emptySubtitle}>
            Necesitas iniciar sesion para enviar dinero
          </GSText>
          <GSButton
            title="Iniciar Sesion"
            onPress={() => navigation.navigate('Auth' as any)}
            style={styles.signInButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      {currentStep !== 'success' && (
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <GSText variant="h3" weight="bold">
            Enviar Dinero
          </GSText>
          <View style={{ width: 24 }} />
        </View>
      )}

      {/* Progress Indicator */}
      {currentStep !== 'success' && (
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      getStepNumber() >= step
                        ? theme.colors.primary
                        : theme.colors.gray300,
                  },
                ]}
              />
              {step < 3 && (
                <View
                  style={[
                    styles.progressLine,
                    {
                      backgroundColor:
                        getStepNumber() > step
                          ? theme.colors.primary
                          : theme.colors.gray300,
                    },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    flex: 1,
    height: 3,
    marginHorizontal: 4,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  actionContainer: {
    marginTop: 24,
  },
  continueButton: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  signInButton: {
    minWidth: 160,
  },
});
