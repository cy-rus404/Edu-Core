import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';

import { supabase } from './supabase';
import { getResponsiveWidth, isVerySmallScreen } from './responsive';

export default function StudentFeesView({ onBack, studentData }) {
  const [feesData, setFeesData] = useState([]);
  const [summary, setSummary] = useState({
    totalDue: 0,
    totalPaid: 0,
    balance: 0
  });
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState({ visible: false, fee: null });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethodModal, setPaymentMethodModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);


  useEffect(() => {
    console.log('StudentFeesView useEffect - studentData:', studentData);
    if (studentData) {
      fetchFeesData();
    } else {
      console.log('StudentFeesView - No student data provided');
    }
  }, [studentData]);

  const fetchFeesData = async () => {
    console.log('fetchFeesData - Starting fetch for student_id:', studentData?.student_id);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_fees')
        .select('*')
        .eq('student_id', studentData.student_id)
        .order('created_at', { ascending: false });

      console.log('fetchFeesData - Supabase response:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching fees:', error);
      }

      const fees = data || [];
      console.log('fetchFeesData - Processed fees:', fees);
      setFeesData(fees);

      // Calculate summary with proper number conversion
      const totalDue = fees.reduce((sum, fee) => sum + (parseFloat(fee.amount_due) || 0), 0);
      const totalPaid = fees.reduce((sum, fee) => sum + (parseFloat(fee.amount_paid) || 0), 0);
      const balance = totalDue - totalPaid;

      console.log('fetchFeesData - Summary calculated:', { totalDue, totalPaid, balance });
      setSummary({ totalDue, totalPaid, balance });
    } catch (error) {
      console.error('Error fetching fees data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#4ECDC4';
      case 'partial': return '#FFA726';
      case 'pending': return '#FF6B6B';
      case 'overdue': return '#FF4444';
      default: return '#666';
    }
  };

  const openPaymentModal = (fee) => {
    console.log('openPaymentModal - Fee data:', fee);
    const balance = (parseFloat(fee.amount_due) || 0) - (parseFloat(fee.amount_paid) || 0);
    console.log('openPaymentModal - Calculated balance:', balance);
    setPaymentAmount(balance.toFixed(2));
    setPaymentModal({ visible: true, fee });
  };

  const closePaymentModal = () => {
    setPaymentModal({ visible: false, fee: null });
    setPaymentAmount('');
  };

  const processPayment = () => {
    console.log('processPayment - Starting with amount:', paymentAmount);
    console.log('processPayment - Current paymentModal.fee:', paymentModal.fee);
    
    const amount = parseFloat(paymentAmount);
    const fee = paymentModal.fee;
    
    console.log('processPayment - Parsed amount:', amount);
    console.log('processPayment - Fee object:', fee);
    
    if (!amount || amount <= 0) {
      console.log('processPayment - Invalid amount error');
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    const balance = (parseFloat(fee.amount_due) || 0) - (parseFloat(fee.amount_paid) || 0);
    console.log('processPayment - Calculated balance:', balance);
    
    if (amount > balance) {
      console.log('processPayment - Amount exceeds balance error');
      Alert.alert('Error', 'Payment amount cannot exceed the outstanding balance');
      return;
    }

    console.log('processPayment - Setting selectedFee and closing modal');
    setSelectedFee({ ...fee });
    closePaymentModal();
    setTimeout(() => {
      console.log('processPayment - Opening payment method modal');
      setPaymentMethodModal(true);
    }, 100);
  };

  const handlePaymentMethod = async (method) => {
    console.log('handlePaymentMethod - Method:', method);
    console.log('handlePaymentMethod - Payment amount:', paymentAmount);
    console.log('handlePaymentMethod - Selected fee:', selectedFee);
    
    const amount = parseFloat(paymentAmount);
    const fee = selectedFee;
    
    console.log('handlePaymentMethod - Parsed amount:', amount);
    console.log('handlePaymentMethod - Fee object:', fee);
    
    setPaymentMethodModal(false);
    
    if (!fee || !fee.id) {
      console.log('handlePaymentMethod - Fee information missing error');
      Alert.alert('Error', 'Fee information missing');
      return;
    }
    
    if (!fee.amount_due || parseFloat(fee.amount_due) <= 0) {
      console.log('handlePaymentMethod - Invalid fee amount');
      Alert.alert('Error', 'Invalid fee amount');
      return;
    }
    
    Alert.alert(
      'Processing Payment',
      `Processing ${method} payment of GH₵${amount.toFixed(2)}...`,
      [{ text: 'OK' }]
    );
    
    setTimeout(async () => {
      try {
        console.log('handlePaymentMethod - Starting payment processing');
        const currentAmountPaid = parseFloat(fee.amount_paid) || 0;
        const amountDue = parseFloat(fee.amount_due) || 0;
        const newAmountPaid = currentAmountPaid + amount;
        const newStatus = newAmountPaid >= amountDue ? 'Paid' : 'Partial';
        const paymentRef = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('handlePaymentMethod - Payment calculation:', {
          currentAmountPaid,
          amountDue,
          paymentAmount: amount,
          newAmountPaid,
          newStatus,
          paymentRef,
          feeId: fee.id
        });

        const updateData = {
          amount_paid: newAmountPaid,
          status: newStatus,
          payment_date: new Date().toISOString().split('T')[0],
          payment_reference: paymentRef,
          updated_at: new Date().toISOString()
        };
        
        console.log('handlePaymentMethod - Update data:', updateData);

        const { data, error } = await supabase
          .from('student_fees')
          .update(updateData)
          .eq('id', fee.id)
          .select();

        console.log('handlePaymentMethod - Supabase update response:', { data, error });

        if (error) {
          console.error('handlePaymentMethod - Supabase error:', error);
          Alert.alert('Error', `Payment failed: ${error.message}`);
          return;
        }

        console.log('handlePaymentMethod - Payment successful');
        
        // Generate receipt
        const receipt = {
          studentName: fee.student_name,
          studentId: fee.student_id,
          feeDescription: fee.description,
          amountPaid: amount,
          paymentMethod: method,
          paymentReference: paymentRef,
          paymentDate: new Date().toLocaleDateString(),
          paymentTime: new Date().toLocaleTimeString()
        };
        
        Alert.alert(
          'Payment Successful! 🎉', 
          `RECEIPT\n\nStudent: ${receipt.studentName}\nID: ${receipt.studentId}\nFee: ${receipt.feeDescription}\nAmount: GH₵${receipt.amountPaid.toFixed(2)}\nMethod: ${receipt.paymentMethod}\nDate: ${receipt.paymentDate}\nTime: ${receipt.paymentTime}\nReference: ${receipt.paymentReference}\n\nThank you for your payment!`,
          [{ text: 'OK' }]
        );
        
        setSelectedFee(null);
        setPaymentAmount('');
        // Force refresh the data
        await fetchFeesData();
        console.log('handlePaymentMethod - Data refreshed after payment');
      } catch (error) {
        console.error('handlePaymentMethod - Catch error:', error);
        Alert.alert('Error', `Payment failed: ${error.message}`);
      }
    }, 2000);
  };

  const renderFeeItem = (fee) => (
    <View key={fee.id} style={styles.feeCard}>
      <View style={styles.feeHeader}>
        <Text style={styles.feeDescription}>{fee.description}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fee.status) }]}>
          <Text style={styles.statusText}>{fee.status || 'Pending'}</Text>
        </View>
      </View>
      
      <View style={styles.feeDetails}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount Due:</Text>
          <Text style={styles.amountValue}>GH₵{(parseFloat(fee.amount_due) || 0).toFixed(2)}</Text>
        </View>
        
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount Paid:</Text>
          <Text style={[styles.amountValue, { color: '#4ECDC4' }]}>
            GH₵{(parseFloat(fee.amount_paid) || 0).toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Balance:</Text>
          <Text style={[styles.amountValue, { color: '#FF6B6B' }]}>
            GH₵{((parseFloat(fee.amount_due) || 0) - (parseFloat(fee.amount_paid) || 0)).toFixed(2)}
          </Text>
        </View>
        
        {fee.due_date && (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Due Date:</Text>
            <Text style={styles.dueDateText}>
              {new Date(fee.due_date).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
      
      {((parseFloat(fee.amount_due) || 0) - (parseFloat(fee.amount_paid) || 0)) > 0 && (
        <TouchableOpacity 
          style={styles.payButton}
          onPress={() => openPaymentModal(fee)}
        >
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Fees</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Fees Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Due:</Text>
            <Text style={styles.summaryAmount}>GH₵{summary.totalDue.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid:</Text>
            <Text style={[styles.summaryAmount, { color: '#4ECDC4' }]}>
              GH₵{summary.totalPaid.toFixed(2)}
            </Text>
          </View>
          
          <View style={[styles.summaryRow, styles.balanceRow]}>
            <Text style={[styles.summaryLabel, styles.balanceLabel]}>Outstanding Balance:</Text>
            <Text style={[styles.summaryAmount, styles.balanceAmount]}>
              GH₵{summary.balance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Fees List */}
        <Text style={styles.sectionTitle}>Fee Details</Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Loading fees...</Text>
        ) : feesData.length > 0 ? (
          feesData.map(renderFeeItem)
        ) : (
          <Text style={styles.emptyText}>No fees information available</Text>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={paymentModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            style={styles.modalKeyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Make Payment</Text>
            
            {paymentModal.fee && (
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentFeeTitle}>{paymentModal.fee.description}</Text>
                <Text style={styles.paymentBalance}>
                  Outstanding: GH₵{((parseFloat(paymentModal.fee.amount_due) || 0) - (parseFloat(paymentModal.fee.amount_paid) || 0)).toFixed(2)}
                </Text>
              </View>
            )}
            
            <Text style={styles.inputLabel}>Payment Amount (GH₵)</Text>
            <TextInput
              style={styles.paymentInput}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={closePaymentModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmButton} onPress={processPayment}>
                <Text style={styles.confirmButtonText}>Continue to Payment</Text>
              </TouchableOpacity>
            </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={paymentMethodModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentMethodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            
            <TouchableOpacity 
              style={styles.paymentMethodButton}
              onPress={() => handlePaymentMethod('Mobile Money')}
            >
              <Text style={styles.paymentMethodText}>📱 Mobile Money</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.paymentMethodButton}
              onPress={() => handlePaymentMethod('Bank Card')}
            >
              <Text style={styles.paymentMethodText}>💳 Bank Card</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.paymentMethodButton}
              onPress={() => handlePaymentMethod('Bank Transfer')}
            >
              <Text style={styles.paymentMethodText}>🏦 Bank Transfer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setPaymentMethodModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: getResponsiveWidth(6),
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 18,
    color: '#4a90e2',
    marginRight: 20,
  },
  title: {
    fontSize: isVerySmallScreen() ? 20 : 24,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  balanceRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    marginTop: 10,
  },
  balanceLabel: {
    fontWeight: '600',
    color: '#333',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  feeCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  feeDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  feeDetails: {
    gap: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dueDateText: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 40,
  },
  payButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  paymentInfo: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  paymentFeeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  paymentBalance: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalKeyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodButton: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#4ECDC4',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});