"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Line, PolarArea, } from 'react-chartjs-2'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpRight, ArrowDownRight, DollarSign, PiggyBank, Trash2, Settings, Download, Upload, Target, AlertTriangle, TrendingUp } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler
)

interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  account: 'chequing' | 'savings'
}

interface Goal {
  id: number
  name: string
  target: number
  current: number
  deadline: string
}

interface UserData {
  name: string
  chequingBalance: string
  savingsBalance: string
  monthlyIncome: string
  monthlyExpenses: string
}

interface BudgetCategory {
  category: string
  limit: number
}

interface Recommendation {
  icon: React.ReactNode
  title: string
  description: string
}

interface Investment {
  id: number
  type: 'RRSP' | 'TFSA' | 'GIC' | 'OSAP'
  balance: number
  interestRate?: number
  maturityDate?: string
}

interface Cryptocurrency {
  id: number
  name: string
  symbol: string
  amount: number
  purchasePrice: number
  currentPrice: number
}

interface FinancialData {
  chequingBalance?: number;
  savingsBalance?: number;
  income?: number;
  expenses?: number;
  transactions?: Transaction[];
  goals?: Goal[];
  budgetCategories?: BudgetCategory[];
  investments?: Investment[];
  cryptocurrencies?: Cryptocurrency[];
  userData?: {
    name?: string;
    chequingBalance?: string;
    savingsBalance?: string;
    monthlyIncome?: string;
    monthlyExpenses?: string;
  };
  financialHealthScore?: number;
}

const categories = [
  'Food', 'Transport', 'Entertainment', 'Utilities', 'Rent', 'Shopping', 'Health', 'Education', 'Savings', 'Other'
]

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value)
}

const validateNumber = (value: string): boolean => {
  return /^\d+(\.\d{1,2})?$/.test(value) && parseFloat(value) >= 0
}

const validateName = (value: string): boolean => {
  return /^[a-zA-Z\s]{2,30}$/.test(value)
}

const calculateFinancialHealth = (income: number, expenses: number, savings: number, investments: number, debt: number): number => {
  if (income === 0) return 0
  const savingsRate = savings / income
  const investmentRate = investments / income
  const debtToIncomeRatio = debt / income
  const expenseRatio = expenses / income

  let score = 0
  score += savingsRate * 30 // Weight savings rate at 30%
  score += investmentRate * 20 // Weight investment rate at 20%
  score += (1 - debtToIncomeRatio) * 25 // Weight debt-to-income ratio at 25%
  score += (1 - expenseRatio) * 25 // Weight expense ratio at 25%

  return Math.min(Math.max(score * 100, 0), 100) // Ensure score is between 0 and 100
}

export default function FinanceTracker() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [chequingBalance, setChequingBalance] = useState(0)
  const [savingsBalance, setSavingsBalance] = useState(0)
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', type: 'expense' as 'income' | 'expense', category: '', date: new Date().toISOString().split('T')[0], account: 'chequing' as 'chequing' | 'savings' })
  const [showQuestionnaire, setShowQuestionnaire] = useState(true)
  const [userData, setUserData] = useState<UserData>({ name: '', chequingBalance: '', savingsBalance: '', monthlyIncome: '', monthlyExpenses: '' })
  const [errors, setErrors] = useState<Partial<UserData>>({})
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [financialHealthScore, setFinancialHealthScore] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const { toast } = useToast()

  // New state for investments and cryptocurrencies
  const [investments, setInvestments] = useState<Investment[]>([])
  const [cryptocurrencies, setCryptocurrencies] = useState<Cryptocurrency[]>([])

  useEffect(() => {
    const storedData = localStorage.getItem('financeTrackerData')
    if (storedData) {
      const parsedData = JSON.parse(storedData)
      updateAllData(parsedData)
    }
  }, [])

  useEffect(() => {
    const totalInvestments = investments.reduce((sum, inv) => sum + inv.balance, 0)
    const totalCryptoValue = cryptocurrencies.reduce((sum, crypto) => sum + crypto.amount * crypto.currentPrice, 0)
    const score = calculateFinancialHealth(income, expenses, savingsBalance, totalInvestments + totalCryptoValue, Math.max(0, -chequingBalance))
    setFinancialHealthScore(score)
  }, [income, expenses, savingsBalance, chequingBalance, investments, cryptocurrencies])

  const updateAllData = (data: FinancialData) => {
    setChequingBalance(data.chequingBalance ?? 0)
    setSavingsBalance(data.savingsBalance ?? 0)
    setIncome(data.income ?? 0)
    setExpenses(data.expenses ?? 0)
    setTransactions(data.transactions ?? [])
    setGoals(data.goals ?? [])
    setBudgetCategories(data.budgetCategories ?? [])
    setInvestments(data.investments ?? [])
    setCryptocurrencies(data.cryptocurrencies ?? [])
    setUserData({
      name: data.userData?.name ?? '',
      chequingBalance: data.userData?.chequingBalance ?? '0',
      savingsBalance: data.userData?.savingsBalance ?? '0',
      monthlyIncome: data.userData?.monthlyIncome ?? '0',
      monthlyExpenses: data.userData?.monthlyExpenses ?? '0'
    })
    setFinancialHealthScore(data.financialHealthScore ?? 0)
    setShowQuestionnaire(false)
  }

  const saveData = () => {
    const dataToSave = {
      chequingBalance,
      savingsBalance,
      income,
      expenses,
      transactions,
      goals,
      budgetCategories,
      investments,
      cryptocurrencies,
      userData,
      financialHealthScore
    }
    localStorage.setItem('financeTrackerData', JSON.stringify(dataToSave))
  }

  const validateUserData = (): boolean => {
    const newErrors: Partial<UserData> = {}
    if (!validateName(userData.name)) {
      newErrors.name = 'Please enter a valid name (2-30 alphabetic characters)'
    }
    if (!validateNumber(userData.chequingBalance)) {
      newErrors.chequingBalance = 'Please enter a valid number'
    }
    if (!validateNumber(userData.savingsBalance)) {
      newErrors.savingsBalance = 'Please enter a valid number'
    }
    if (!validateNumber(userData.monthlyIncome)) {
      newErrors.monthlyIncome = 'Please enter a valid number'
    }
    if (!validateNumber(userData.monthlyExpenses)) {
      newErrors.monthlyExpenses = 'Please enter a valid number'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleQuestionnaireSubmit = () => {
    if (validateUserData()) {
      const initialChequingBalance = parseFloat(userData.chequingBalance)
      const initialSavingsBalance = parseFloat(userData.savingsBalance)
      const monthlyIncome = parseFloat(userData.monthlyIncome)
      const monthlyExpenses = parseFloat(userData.monthlyExpenses)

      setChequingBalance(initialChequingBalance)
      setSavingsBalance(initialSavingsBalance)
      setIncome(monthlyIncome)
      setExpenses(monthlyExpenses)

      const currentDate = new Date().toISOString().split('T')[0]
      setTransactions([
        { id: 1, date: currentDate, description: 'Initial Chequing Balance', amount: initialChequingBalance, type: 'income', category: 'Other', account: 'chequing' },
        { id: 2, date: currentDate, description: 'Initial Savings Balance', amount: initialSavingsBalance, type: 'income', category: 'Other', account: 'savings' },
        { id: 3, date: currentDate, description: 'Monthly Income', amount: monthlyIncome, type: 'income', category: 'Other', account: 'chequing' },
        { id: 4, date: currentDate, description: 'Monthly Expenses', amount: -monthlyExpenses, type: 'expense', category: 'Other', account: 'chequing' },
      ])

      setShowQuestionnaire(false)
      saveData()
      toast({
        description: 'Welcome to FinancialFlow 💸! Your initial data has been saved.',
      })
    }
  }

  const addTransaction = () => {
    if (newTransaction.description && newTransaction.amount && newTransaction.category && newTransaction.account) {
      if (!validateNumber(newTransaction.amount)) {
        toast({
          description: 'Please enter a valid amount',
        })
        return
      }
      const amount = newTransaction.type === 'income' ? parseFloat(newTransaction.amount) : -parseFloat(newTransaction.amount)
      const transaction: Transaction = {
        id: transactions.length + 1,
        date: newTransaction.date,
        description: newTransaction.description,
        amount,
        type: newTransaction.type,
        category: newTransaction.category,
        account: newTransaction.account,
      }
      const updatedTransactions = [transaction, ...transactions]
      setTransactions(updatedTransactions)
      updateFinances(amount, newTransaction.account)
      setNewTransaction({ description: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0], account: 'chequing' })
      saveData()
      toast({
        description: 'Transaction added successfully',
      })
    } else {
      toast({
        description: 'Please fill in all fields for the transaction',
      })
    }
  }



  const updateFinances = (amount: number, account: 'chequing' | 'savings') => {
    if (account === 'chequing') {
      setChequingBalance(prevBalance => prevBalance + amount)
    } else {
      setSavingsBalance(prevBalance => prevBalance + amount)
    }
    if (amount > 0) {
      setIncome(prevIncome => prevIncome + amount)
    } else {
      setExpenses(prevExpenses => prevExpenses - amount)
    }
    updateGoalProgress(amount)
  }

  const updateGoalProgress = (amount: number) => {
    setGoals(prevGoals => 
      prevGoals.map(goal => ({
        ...goal,
        current: goal.current + (amount > 0 ? amount : 0)
      }))
    )
  }


  const deleteTransaction = (id: number) => {
    const transactionToDelete = transactions.find(t => t.id === id)
    if (transactionToDelete) {
      const updatedTransactions = transactions.filter(t => t.id !== id)
      setTransactions(updatedTransactions)
      updateFinances(-transactionToDelete.amount, transactionToDelete.account)
      saveData()
      toast({
        description: 'Transaction deleted successfully',
      })
    }
  }


  const generateBudgetRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = []
    const totalIncome = income
    const totalExpenses = expenses
    const savingsRate = totalIncome > 0 ? (savingsBalance / totalIncome) * 100 : 0
    const emergencyFundTarget = totalExpenses * 3

    if (savingsRate < 20) {
      recommendations.push({
        icon: <Target className="h-6 w-6 text-blue-500" />,
        title: "Savings Boost Needed",
        description: `You're currently saving ${savingsRate.toFixed(1)}% of your income. Aim to increase this to at least 20%. Try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.`
      })
    } else {
      recommendations.push({
        icon: <PiggyBank className="h-6 w-6 text-green-500" />,
        title: "Savings Superstar",
        description: `Fantastic job on your savings! You're currently stashing away ${savingsRate.toFixed(1)}% of your income. Keep up the great work and consider setting even more ambitious savings goals.`
      })
    }

    if (savingsBalance < emergencyFundTarget) {
      recommendations.push({
        icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
        title: "Emergency Fund Alert",
        description: `Your current savings of ${formatCurrency(savingsBalance)} is below the recommended 3-month emergency fund of ${formatCurrency(emergencyFundTarget)}. Start small by setting aside a fixed amount each month specifically for emergencies.`
      })
    }

    if (totalExpenses / totalIncome > 0.7) {
      recommendations.push({
        icon: <TrendingUp className="h-6 w-6 text-red-500" />,
        title: "Income-Expense Gap",
        description: `Your expenses are taking up ${((totalExpenses / totalIncome) * 100).toFixed(1)}% of your income. Consider ways to increase your income or reduce expenses to widen this gap.`
      })
    }

    return recommendations
  }

  const getFinancialBreakdownData = () => {
    const totalAssets = chequingBalance + savingsBalance
    const debt = Math.max(0, -chequingBalance) // Consider negative chequing balance as debt
    const netWorth = totalAssets - debt

    return {
      labels: ['Chequing', 'Savings', 'Debt', 'Net Worth'],
      datasets: [
        {
          data: [Math.max(0, chequingBalance), savingsBalance, debt, netWorth],
          backgroundColor: [
            'rgba(199, 46, 171, 0.6)',
            'rgba(204, 193, 197, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgb(53, 233, 188)',
            'rgb(166, 33, 35)',
            'rgb(59, 93, 28)',
            'rgb(90, 80, 33)',
          ],
          borderWidth: 1,
        },
      ],
    }
  }

  const getCashFlowData = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentDate = new Date()
    const labels = Array.from({length: 6}, (_, i) => {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5 + i, 1)
      return monthNames[d.getMonth()]
    })

    const incomeData = Array(6).fill(0)
    const expenseData = Array(6).fill(0)
    const savingsData = Array(6).fill(0)

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date)
      const monthIndex = 5 - (currentDate.getMonth() - transactionDate.getMonth() + (currentDate.getFullYear() - transactionDate.getFullYear()) * 12)
      if (monthIndex >= 0 && monthIndex < 6) {
        if (transaction.type === 'income') {
          incomeData[monthIndex] += transaction.amount
        } else {
          expenseData[monthIndex] += Math.abs(transaction.amount)
        }
      }
    })

    // Calculate savings (income - expenses) for each month
    for (let i = 0; i < 6; i++) {
      savingsData[i] = incomeData[i] - expenseData[i]
    }

    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1,
        },
        {
          label: 'Savings',
          data: savingsData,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          tension: 0.1,
        },
      ],
    }
  }

  // const resetAllData = () => {
  //   localStorage.removeItem('financeTrackerData')
  //   setChequingBalance(0)
  //   setSavingsBalance(0)
  //   setIncome(0)
  //   setExpenses(0)
  //   setTransactions([])
  //   setGoals([])
  //   setBudgetCategories([])
  //   setInvestments([])
  //   setCryptocurrencies([])
  //   setUserData({ name: '', chequingBalance: '', savingsBalance: '', monthlyIncome: '', monthlyExpenses: '' })
  //   setShowQuestionnaire(true)
  //   toast({
  //     description: 'All data has been reset. Please enter your initial information.',
  //   })
  // }

  const handleSettingsChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }))
  }

  const saveSettings = () => {
    if (validateUserData()) {
      const newChequingBalance = parseFloat(userData.chequingBalance)
      const newSavingsBalance = parseFloat(userData.savingsBalance)
      const newMonthlyIncome = parseFloat(userData.monthlyIncome)
      const newMonthlyExpenses = parseFloat(userData.monthlyExpenses)
      
      setChequingBalance(newChequingBalance)
      setSavingsBalance(newSavingsBalance)
      setIncome(newMonthlyIncome)
      setExpenses(newMonthlyExpenses)
      
      saveData()
      setShowSettings(false)
      toast({
        description: "Settings updated successfully",
      })
    } else {
      toast({
        description: "Please enter valid values for all fields",
        variant: "destructive",
      })
    }
  }

  const exportData = () => {
    const dataToExport = {
      chequingBalance,
      savingsBalance,
      income,
      expenses,
      transactions,
      goals,
      budgetCategories,
      investments,
      cryptocurrencies,
      userData,
      financialHealthScore
    }
    const dataStr = JSON.stringify(dataToExport)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = 'financial_data.json'

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string)
          updateAllData(importedData)
          saveData()
          toast({
            description: "Data imported successfully",
          })
        } catch (error) {
          toast({
            description: "Error importing data. Please check the file format.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AnimatePresence>
        {showQuestionnaire && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-green bg-opacity-50 flex items-center justify-center z-50"
          >
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Welcome to FinancialFlow 💸</CardTitle>
                <CardDescription>Please provide some initial information to get started.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chequingBalance">Initial Chequing Balance ($)</Label>
                    <Input
                      id="chequingBalance"
                      type="text"
                      value={userData.chequingBalance}
                      onChange={(e) => setUserData({ ...userData, chequingBalance: e.target.value })}
                    />
                    {errors.chequingBalance && <p className="text-red-500 text-sm">{errors.chequingBalance}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="savingsBalance">Initial Savings Balance ($)</Label>
                    <Input
                      id="savingsBalance"
                      type="text"
                      value={userData.savingsBalance}
                      onChange={(e) => setUserData({ ...userData, savingsBalance: e.target.value })}
                    />
                    {errors.savingsBalance && <p className="text-red-500 text-sm">{errors.savingsBalance}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome">Monthly Income ($)</Label>
                    <Input
                      id="monthlyIncome"
                      type="text"
                      value={userData.monthlyIncome}
                      onChange={(e) => setUserData({ ...userData, monthlyIncome: e.target.value })}
                    />
                    {errors.monthlyIncome && <p className="text-red-500 text-sm">{errors.monthlyIncome}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyExpenses">Monthly Expenses ($)</Label>
                    <Input
                      id="monthlyExpenses"
                      type="text"
                      value={userData.monthlyExpenses}
                      onChange={(e) => setUserData({ ...userData, monthlyExpenses: e.target.value })}
                    />
                    {errors.monthlyExpenses && <p className="text-red-500 text-sm">{errors.monthlyExpenses}</p>}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleQuestionnaireSubmit} className="w-full">Start Tracking</Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-blue-800 shadow-md">
        <nav className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <Button variant="ghost" onClick={() => setActiveTab('dashboard')}>Dashboard</Button>
              <Button variant="ghost" onClick={() => setActiveTab('transactions')}>Transactions</Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-8">Welcome back, {userData.name || 'User'}!</h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chequing Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(chequingBalance)}</div>
              <p className="text-xs text-muted-foreground">
                {chequingBalance > 0 ? '+' : ''}{income > 0 ? ((chequingBalance / income) * 100).toFixed(1) : 0}% of income
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings Balance</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(savingsBalance)}</div>
              <p className="text-xs text-muted-foreground">
                {income > 0 ? ((savingsBalance / income) * 100).toFixed(1) : 0}% of income
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Income</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(income)}</div>
              <p className="text-xs text-muted-foreground">
                +{(expenses + savingsBalance) > 0 ? ((income / (expenses + savingsBalance)) * 100).toFixed(1) : 0}% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(expenses)}</div>
              <p className="text-xs text-muted-foreground">
                {income > 0 ? ((expenses / income) * 100).toFixed(1) : 0}% of income
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 bg-pink-800">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-pink-700 text-white">Dashboard</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-pink-700 text-white">Transactions</TabsTrigger>
            
          </TabsList>
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <PolarArea
                    data={getFinancialBreakdownData()}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw as number;
                              const total = context.dataset.data.reduce((a: number, b: number) => a + Math.abs(b as number), 0) as number;
                              const percentage = total > 0 ? ((Math.abs(value) / total) * 100).toFixed(1) : '0.0';
                              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      scales: {
                        r: {
                          ticks: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <DollarSign className="h-12 w-12 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Account</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.slice(0, 5).map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{transaction.date}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell className={transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                              {formatCurrency(Math.abs(transaction.amount))}
                            </TableCell>
                            <TableCell>{transaction.category}</TableCell>
                            <TableCell>{transaction.account}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Cash Flow Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Line data={getCashFlowData()} options={{ responsive: true }} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Budget Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {generateBudgetRecommendations().map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-4 mb-4 bg-yellow-800 p-4 rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {recommendation.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1 text-white">{recommendation.title}</h3>
                          <p className="text-sm text-gray-300">{recommendation.description}</p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Manage your income and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-4">
                    <Input
                      placeholder="Description"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    />
                    <Input
                      type="text"
                      placeholder="Amount"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    />
                    <Select
                      value={newTransaction.type}
                      onValueChange={(value: 'income' | 'expense') => setNewTransaction({ ...newTransaction, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={newTransaction.category}
                      onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={newTransaction.account}
                      onValueChange={(value: 'chequing' | 'savings') => setNewTransaction({ ...newTransaction, account: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chequing">Chequing</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    />
                    <Button onClick={addTransaction}>Add Transaction</Button>
                  </div>
                </div>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className={transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                            {formatCurrency(Math.abs(transaction.amount))}
                          </TableCell>
                          <TableCell>{transaction.type}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>{transaction.account}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => deleteTransaction(transaction.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
        </Tabs>
      </main>

      

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-white text-black">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Update your personal information and preferences</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={userData.name}
                onChange={(e) => handleSettingsChange('name', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chequingBalance" className="text-right">
                Chequing Balance
              </Label>
              <Input
                id="chequingBalance"
                value={userData.chequingBalance}
                onChange={(e) => handleSettingsChange('chequingBalance', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="savingsBalance" className="text-right">
                Savings Balance
              </Label>
              <Input
                id="savingsBalance"
                value={userData.savingsBalance}
                onChange={(e) => handleSettingsChange('savingsBalance', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monthlyIncome" className="text-right">
                Monthly Income
              </Label>
              <Input
                id="monthlyIncome"
                value={userData.monthlyIncome}
                onChange={(e) => handleSettingsChange('monthlyIncome', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monthlyExpenses" className="text-right">
                Monthly Expenses
              </Label>
              <Input
                id="monthlyExpenses"
                value={userData.monthlyExpenses}
                onChange={(e) => handleSettingsChange('monthlyExpenses', e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">Data Management</h3>
            <p className="text-sm text-gray-500 mb-4">Export or import your financial data for backup or when switching devices.</p>
            <div className="flex space-x-4">
              <Button onClick={exportData}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Label htmlFor="import-file" className="cursor-pointer">
                <div className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </div>
              </Label>
              <Input
                id="import-file"
                type="file"
                onChange={importData}
                className="hidden"
                accept=".json"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}