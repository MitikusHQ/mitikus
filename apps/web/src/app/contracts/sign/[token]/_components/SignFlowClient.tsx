'use client'

import { useState } from 'react'
import { OtpVerifyClient }  from './OtpVerifyClient'
import { PublicSignClient } from './PublicSignClient'

interface Props {
  shareToken:    string
  contractTitle: string
  pdfDataArray:  number[]
  workspaceName: string | null
  clientEmail:   string | null
  requiresOtp:   boolean
  initialWait:   number
}

export function SignFlowClient({
  shareToken,
  contractTitle,
  pdfDataArray,
  workspaceName,
  clientEmail,
  requiresOtp,
  initialWait,
}: Props) {
  const [otpVerified, setOtpVerified] = useState(!requiresOtp)

  if (!otpVerified && clientEmail) {
    return (
      <OtpVerifyClient
        shareToken={shareToken}
        clientEmail={clientEmail}
        initialWait={initialWait}
        onVerified={() => setOtpVerified(true)}
      />
    )
  }

  return (
    <PublicSignClient
      shareToken={shareToken}
      contractTitle={contractTitle}
      pdfDataArray={pdfDataArray}
      workspaceName={workspaceName}
    />
  )
}
