import React, { useEffect } from 'react'
import FarmList from '@components/FarmsList/FarmList'
import { status } from '@selectors/solanaWallet'
import { Grid } from '@material-ui/core'
import { Status } from '@reducers/solanaWallet'
import { useSelector, useDispatch } from 'react-redux'
import { farmsWithUserStakedValues, isLoadingFarms, userStakes } from '@selectors/farms'
import { pools, tokens } from '@selectors/pools'
import { calcYPerXPrice, printBN } from '@consts/utils'
import { actions } from '@reducers/farms'
import { DECIMAL } from '@invariant-labs/sdk/lib/utils'
import loader from '@static/gif/loader.gif'
import { positionsList } from '@selectors/positions'

export const FarmsWrapper: React.FC = () => {
  const dispatch = useDispatch()
  const walletStatus = useSelector(status)
  const allFarms = useSelector(farmsWithUserStakedValues)
  const allPools = useSelector(pools)
  const allTokens = useSelector(tokens)
  const allUserStakes = useSelector(userStakes)
  const farmsLoading = useSelector(isLoadingFarms)
  const { list } = useSelector(positionsList)

  useEffect(() => {
    if (Object.values(allTokens).length > 0 && Object.values(allFarms).length === 0) {
      dispatch(actions.getFarms())
    }
  }, [Object.values(allTokens).length])

  useEffect(() => {
    if (
      walletStatus === Status.Initialized &&
      Object.values(allFarms).length > 0 &&
      Object.values(allUserStakes).length === 0 &&
      list.length > 0
    ) {
      dispatch(actions.getUserStakes())
    }
  }, [walletStatus, Object.values(allFarms).length, list])

  const data = Object.values(allFarms).map(farm => {
    const now = Date.now() / 1000

    const poolData = allPools[farm.pool.toString()]

    const currentPrice = calcYPerXPrice(
      poolData.sqrtPrice.v,
      allTokens[poolData.tokenX.toString()].decimals,
      allTokens[poolData.tokenY.toString()].decimals
    )

    return {
      apyPercent: 0,
      totalStaked: (farm.totalStakedX ?? 0) + (farm.totalStakedY ?? 0) / currentPrice,
      yourStaked: (farm.userStakedX ?? 0) + (farm.userStakedY ?? 0) / currentPrice,
      tokenX: allTokens[allPools[farm.pool.toString()].tokenX.toString()],
      tokenY: allTokens[allPools[farm.pool.toString()].tokenY.toString()],
      farmId: farm.address.toString(),
      rewardSymbol: allTokens[farm.rewardToken.toString()].symbol,
      rewardIcon: allTokens[farm.rewardToken.toString()].logoURI,
      isActive: now >= farm.startTime.v.toNumber() && now <= farm.endTime.v.toNumber(),
      feeTier: +printBN(allPools[farm.pool.toString()].fee.v, DECIMAL - 2)
    }
  })

  return (
    <Grid container direction='column' alignItems='center'>
      {farmsLoading ? (
        <img src={loader} style={{ width: 150, height: 150, margin: 'auto' }} />
      ) : (
        <>
          <FarmList
            title={'Active farms'}
            data={data.filter(({ isActive }) => isActive)}
            emptyDesc='There are no active farms at this moment'
          />
          <FarmList
            title={'Inactive farms'}
            data={[]}
            emptyDesc='There are no inactive farms at this moment'
          />
        </>
      )}
    </Grid>
  )
}
