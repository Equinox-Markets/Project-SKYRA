import { useContext, useEffect, useState } from "react";
import ChartBorrow from "./ChartBorrow";
import ChartSupply from "./ChartSupply";
import { TenderContext } from "~/contexts/tender-context";
import TokenChartEmpty from "./tokenChartEmpty";
import TokenTopDetails from "./tokenTopDetails";

export interface IDataSupplyDot {
  supplyAPY: string;
  date: string;
  totalSupply: string;
}
export interface IDataBorrowDot {
  borrowAPY: string;
  date: string;
  totalBorrow: string;
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function TokenChart({
  marketInfo,
  historicalData,
}: {
  marketInfo: object | boolean;
  historicalData: object | boolean;
}) {
  const [tabName, setTabName] = useState<string>("supply");
  const { networkData } = useContext(TenderContext);
  const [supplyChartData, setSupplyChartData] = useState<IDataSupplyDot[]>([]);
  const [borrowChartData, setBorrowChartData] = useState<IDataBorrowDot[]>([]);

  useEffect(() => {
    if (!historicalData || !networkData) {
      return;
    }

    const date = new Date();
    date.setDate(date.getDate() - Object.keys(historicalData).length + 1);

    const secondsPerBlock = networkData.secondsPerBlock;
    const daysPerYear = 365;
    const blocksPerDay = Math.round((60 * 60 * 24) / secondsPerBlock);
    const ethBlocksPerYear = 2102400; // subgraph uses 2102400

    const supplyChart: IDataSupplyDot[] = [];
    const borrowChart: IDataBorrowDot[] = [];

    Object.keys(historicalData).forEach(function (i, index) {
      // @ts-ignore
      const data = historicalData[i][0];
      const supplyRate = data.supplyRate / ethBlocksPerYear;
      const supplyApy =
        marketInfo?.tokenSymbol === "GLP" || marketInfo?.tokenSymbol === "GMX"
          ? data.supplyRate
          : (Math.pow(supplyRate * blocksPerDay + 1, daysPerYear) - 1) * 100;
      const totalSupply =
        parseFloat(data.cash) +
        parseFloat(data.totalBorrows) -
        parseFloat(data.reserves);

      supplyChart.push({
        totalSupply: (totalSupply * data.underlyingPriceUSD).toFixed(2),
        supplyAPY: supplyApy.toFixed(2),
        date: `${date.getDate()} ${monthNames[date.getMonth()]}`,
      });

      const borrowRate = data.borrowRate / ethBlocksPerYear;
      const borrowApy =
        (Math.pow(borrowRate * blocksPerDay + 1, daysPerYear) - 1) * 100;

      borrowChart.push({
        totalBorrow: (data.totalBorrows * data.underlyingPriceUSD).toFixed(2),
        borrowAPY: borrowApy.toFixed(2),
        date: `${date.getDate()} ${monthNames[date.getMonth()]}`,
      });

      date.setDate(date.getDate() + 1);
    });

    setSupplyChartData(supplyChart);
    setBorrowChartData(borrowChart);
  }, [historicalData, marketInfo, networkData]);

  return marketInfo?.underlyingSymbol ? (
    <div
      tabIndex={0}
      className="bg-[#0D0D0D] panel-custom mb-[60px] md:mb-[60px] pb-[20px] lg:pb-0"
    >
      <div className="px-[15px] mb-[30px] md:mb-[26px] py-[17px] md:py-[20px] border-b border-[#282C2B] md:px-[30px] md:pt-[18px] md:pb-[19px] leading-[22px] font-semibold text-base md:text-lg font-nova">
        <a className="cursor-pointer hover:text-[#14f195]" href="/markets/">
          Markets
        </a>
        <span className="text-[#818987]"> / {marketInfo?.tokenSymbol}</span>
      </div>
      <TokenTopDetails marketInfo={marketInfo} />
      <div className="mt-[33px] flex font-[SpaceGrotesk] uppercase font-bold text-xs leading-5 border-b border-[#282C2B] md:text-[15px] md:leading-[25.5px]">
        <button
          tabIndex={0}
          onClick={() => setTabName("supply")}
          className={`cursor-pointer uppercase text-center w-full pb-[6px] md:pb-[12px] border-b-[3px] md:w-[170px] hover:text-[#14F195] ${
            tabName === "supply"
              ? "border-[#14F195] text-[#14F195]"
              : "border-[transparent] text-white"
          }`}
        >
          supply
        </button>
        {marketInfo?.tokenSymbol !== "GLP" && (
          <button
            tabIndex={0}
            onClick={() => setTabName("borrow")}
            className={`cursor-pointer uppercase text-center w-full pb-[6px] md:pb-[12px] border-b-[3px] md:w-[170px] hover:text-[#00E0FF] ${
              tabName === "borrow"
                ? "border-[#00E0FF] text-[#00E0FF]"
                : "border-[transparent] text-white"
            }`}
          >
            borrow
          </button>
        )}
      </div>
      {tabName === "supply" ? (
        supplyChartData.length ? (
          <ChartSupply data={supplyChartData} />
        ) : (
          <div className="pt-[40px] pb-[20px] md:pb-[40px] pl-[20px] pr-[20px]">
            <div className="animate w-full h-[255px] md:h-[293px]"></div>
          </div>
        )
      ) : borrowChartData.length ? (
        <ChartBorrow data={borrowChartData} />
      ) : (
        <div className="pt-[40px] pb-[20px] md:pb-[40px] pl-[20px] pr-[20px]">
          <div className="animate w-full h-[255px] md:h-[293px]"></div>
        </div>
      )}
    </div>
  ) : (
    <TokenChartEmpty />
  );
}

export default TokenChart;
